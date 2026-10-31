begin;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

-- Una única restricción protege reservas y futuros bloqueos, con intervalos [inicio, fin).
create table public.court_occupancies (
  id uuid primary key default gen_random_uuid(),
  complex_id uuid not null,
  court_id uuid not null,
  kind text not null check (kind in ('reservation', 'block')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  foreign key (complex_id, court_id) references public.courts(complex_id, id),
  unique (complex_id, court_id, id),
  check (isfinite(starts_at) and isfinite(ends_at) and ends_at > starts_at),
  exclude using gist (court_id extensions.gist_uuid_ops with =,
    tstzrange(starts_at, ends_at, '[)') with &&) where (active)
);
create table public.reservations (
  id uuid primary key,
  complex_id uuid not null,
  court_id uuid not null,
  service_date date not null,
  start_minute integer not null check (start_minute between 0 and 2879),
  customer_name text not null check (length(customer_name) between 2 and 100),
  customer_email text not null check (length(customer_email) between 3 and 254),
  status text not null default 'pending_deposit' check (status in ('pending_deposit', 'confirmed', 'expired')),
  total_in_cents bigint not null check (total_in_cents between 0 and 99999999999),
  deposit_in_cents bigint not null,
  deposit_percent integer not null default 30 check (deposit_percent = 30),
  hold_minutes integer not null default 15 check (hold_minutes = 15),
  currency text not null default 'ARS' check (currency = 'ARS'),
  duration_minutes integer not null check (duration_minutes in (60, 90)),
  created_at timestamptz not null,
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id),
  request_id uuid not null,
  unique (complex_id, id),
  unique (complex_id, request_id),
  foreign key (complex_id, court_id, id) references public.court_occupancies(complex_id, court_id, id),
  check (deposit_in_cents = (total_in_cents * 30 + 50) / 100),
  check (expires_at = created_at + interval '15 minutes')
);
create table public.reservation_events (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null,
  complex_id uuid not null,
  foreign key (complex_id, reservation_id) references public.reservations(complex_id, id),
  event text not null check (event in ('created', 'expired')),
  occurred_at timestamptz not null,
  unique (reservation_id, event)
);
alter table public.court_occupancies enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_events enable row level security;
create policy occupancy_read on public.court_occupancies for select to authenticated using (private.has_membership(complex_id));
create policy reservation_read on public.reservations for select to authenticated using (private.has_membership(complex_id));
create policy reservation_events_read on public.reservation_events for select to authenticated using (private.has_membership(complex_id));
revoke all on public.court_occupancies, public.reservations, public.reservation_events from public, anon, authenticated;
grant select on public.court_occupancies, public.reservations, public.reservation_events to authenticated;

-- Los cambios de excepciones y las reservas se serializan sobre la misma cancha.
create function private.lock_exception_court() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.courts where id = new.court_id and complex_id = new.complex_id for update;
  return new;
end;
$$;
revoke all on function private.lock_exception_court() from public, anon, authenticated;
create trigger lock_exception_court before insert or update on public.court_date_exceptions
for each row execute function private.lock_exception_court();

create function private.service_hours(target_court uuid, target_date date)
returns table (opens integer, closes integer) language sql stable set search_path = '' as $$
  select e.opens_minute, e.closes_minute from public.court_date_exceptions e
    where e.court_id = target_court and e.service_date = target_date and e.active and not e.closed
  union all
  select w.opens_minute, w.closes_minute from public.court_weekly_hours w
    where w.court_id = target_court and w.weekday = extract(isodow from target_date)::integer - 1
      and not exists (select 1 from public.court_date_exceptions e
        where e.court_id = target_court and e.service_date = target_date and e.active);
$$;
revoke all on function private.service_hours(uuid, date) from public, anon, authenticated;

-- Llamar con la cancha ya bloqueada. No depende de un job para reutilizar un turno vencido.
create function private.expire_court_reservations(target_court uuid, server_now timestamptz)
returns void language plpgsql set search_path = '' as $$
begin
  with expired as (
    update public.reservations set status = 'expired'
    where court_id = target_court and status = 'pending_deposit' and expires_at <= server_now
    returning id, complex_id
  ), released as (
    update public.court_occupancies set active = false where id in (select id from expired)
  )
  insert into public.reservation_events(reservation_id, complex_id, event, occurred_at)
    select id, complex_id, 'expired', server_now from expired;
end;
$$;
revoke all on function private.expire_court_reservations(uuid, timestamptz) from public, anon, authenticated;

create function public.create_team_reservation(
  target_complex uuid, target_court uuid, target_date date, target_minute integer,
  guest_name text, guest_email text, idempotency_key uuid
) returns public.reservations language plpgsql security definer set search_path = '' as $$
declare
  court public.courts%rowtype;
  booking public.reservations%rowtype;
  hours record;
  server_now timestamptz;
  start_instant timestamptz;
  end_instant timestamptz;
  booking_id uuid;
  normalized_name text := btrim(guest_name);
  normalized_email text := lower(btrim(guest_email));
begin
  if not private.has_membership(target_complex) then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if target_date is null or target_date not between date '2000-01-02' and date '9998-12-30'
    or target_minute is null or target_minute not between 0 and 2879 or idempotency_key is null
    or normalized_name is null or length(normalized_name) not between 2 and 100
    or normalized_email is null or length(normalized_email) > 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid reservation' using errcode = '22023';
  end if;
  -- Serializa la misma clave incluso si se reintenta con otra cancha.
  perform pg_advisory_xact_lock(hashtextextended(target_complex::text || idempotency_key::text, 0));
  select * into court from public.courts where id = target_court and complex_id = target_complex for update;
  if not found then raise exception 'Access denied' using errcode = '42501'; end if;
  server_now := clock_timestamp();
  perform private.expire_court_reservations(target_court, server_now);
  select * into booking from public.reservations where complex_id = target_complex and request_id = idempotency_key;
  if found then
    if booking.court_id <> target_court or booking.service_date <> target_date or booking.start_minute <> target_minute
      or booking.customer_name <> normalized_name or booking.customer_email <> normalized_email
      or booking.created_by <> auth.uid() then
      raise exception 'Idempotency key reused with different request' using errcode = '22023';
    end if;
    return booking;
  end if;
  if not court.active then raise exception 'Inactive court' using errcode = '22023'; end if;
  select * into hours from private.service_hours(target_court, target_date);
  if not found then raise exception 'Closed service day' using errcode = '22023'; end if;
  if target_minute < hours.opens or target_minute + court.duration_minutes > hours.closes
    or (target_minute - hours.opens) % court.duration_minutes <> 0 then
    raise exception 'Invalid slot' using errcode = '22023';
  end if;
  if exists (select 1 from private.service_hours(target_court, target_date - 1) p where p.closes - 1440 > hours.opens)
    or exists (select 1 from private.service_hours(target_court, target_date + 1) n where hours.closes > n.opens + 1440) then
    raise exception 'Overlapping service days' using errcode = '22023';
  end if;
  start_instant := (target_date::timestamp + make_interval(mins => target_minute)) at time zone 'America/Argentina/Buenos_Aires';
  end_instant := start_instant + make_interval(mins => court.duration_minutes);
  if start_instant < server_now + interval '2 hours' or start_instant > server_now + interval '720 hours' then
    raise exception 'Outside booking window' using errcode = '22023';
  end if;
  insert into public.court_occupancies(complex_id, court_id, kind, starts_at, ends_at)
    values (target_complex, target_court, 'reservation', start_instant, end_instant) returning id into booking_id;
  insert into public.reservations(id, complex_id, court_id, service_date, start_minute,
    customer_name, customer_email, total_in_cents, deposit_in_cents, duration_minutes,
    created_at, expires_at, created_by, request_id)
    values (booking_id, target_complex, target_court, target_date, target_minute,
      normalized_name, normalized_email, court.price_in_cents, (court.price_in_cents * 30 + 50) / 100,
      court.duration_minutes, server_now, server_now + interval '15 minutes', auth.uid(), idempotency_key)
    returning * into booking;
  insert into public.reservation_events(reservation_id, complex_id, event, occurred_at)
    values (booking.id, target_complex, 'created', server_now);
  return booking;
end;
$$;
revoke all on function public.create_team_reservation(uuid, uuid, date, integer, text, text, uuid) from public, anon;
grant execute on function public.create_team_reservation(uuid, uuid, date, integer, text, text, uuid) to authenticated;
commit;
