begin;
-- Lectura privada: el reloj y la ocupación efectiva se resuelven en PostgreSQL.
create function public.get_team_availability(target_complex uuid, target_court uuid, target_date date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  court public.courts%rowtype;
  hours record;
  server_now timestamptz := statement_timestamp();
  reason text;
  slots jsonb := '[]'::jsonb;
begin
  if not private.has_membership(target_complex) then raise exception 'Access denied' using errcode = '42501'; end if;
  if target_date is null or target_date not between date '2000-01-02' and date '9998-12-30' then
    raise exception 'Invalid date' using errcode = '22023';
  end if;
  select * into court from public.courts where id = target_court and complex_id = target_complex;
  if not found then raise exception 'Access denied' using errcode = '42501'; end if;
  select * into hours from private.service_hours(target_court, target_date);
  if not found then reason := 'closed';
  elsif not court.active then reason := 'inactive';
  elsif exists(select 1 from private.service_hours(target_court, target_date - 1) p where p.closes - 1440 > hours.opens)
    or exists(select 1 from private.service_hours(target_court, target_date + 1) n where hours.closes > n.opens + 1440)
    then reason := 'schedule_conflict';
  end if;
  if reason is null then
    select coalesce(jsonb_agg(jsonb_build_object(
      'minute', s.minute, 'starts_at', s.starts_at, 'ends_at', s.ends_at,
      'state', case
        when s.starts_at < server_now + interval '2 hours' then 'too_soon'
        when s.starts_at > server_now + interval '720 hours' then 'too_late'
        when exists(select 1 from public.court_occupancies o
          left join public.reservations r on r.id = o.id and r.complex_id = o.complex_id
          where o.complex_id = target_complex and o.court_id = target_court and o.active
            and o.starts_at < s.ends_at and o.ends_at > s.starts_at
            and not (o.kind = 'reservation' and r.id is not null
              and (r.status = 'expired' or (r.status = 'pending_deposit' and r.expires_at <= server_now))))
          then 'occupied' else 'available' end
    ) order by s.minute), '[]'::jsonb) into slots
    from (
      select minute,
        (target_date::timestamp + make_interval(mins => minute)) at time zone 'America/Argentina/Buenos_Aires' as starts_at,
        (target_date::timestamp + make_interval(mins => minute + court.duration_minutes)) at time zone 'America/Argentina/Buenos_Aires' as ends_at
      from generate_series(hours.opens, hours.closes - court.duration_minutes, court.duration_minutes) minute
    ) s;
  end if;
  return jsonb_build_object('server_now', server_now, 'reason', reason, 'slots', slots,
    'court_name', court.name, 'duration_minutes', court.duration_minutes,
    'total_in_cents', court.price_in_cents, 'deposit_in_cents', (court.price_in_cents * 30 + 50) / 100);
end;
$$;
revoke all on function public.get_team_availability(uuid, uuid, date) from public, anon;
grant execute on function public.get_team_availability(uuid, uuid, date) to authenticated;

-- Mantiene el orden de locks del motor original. Un precio cambiado exige una
-- nueva confirmación del formulario; los reintentos conservan su snapshot original.
create function public.create_quoted_team_reservation(
  target_complex uuid, target_court uuid, target_date date, target_minute integer,
  guest_name text, guest_email text, idempotency_key uuid, expected_total bigint
) returns public.reservations language plpgsql security definer set search_path = '' as $$
declare current_total bigint;
begin
  if not private.has_membership(target_complex) then raise exception 'Access denied' using errcode = '42501'; end if;
  if idempotency_key is null or expected_total is null or expected_total not between 0 and 99999999999 then
    raise exception 'Invalid request' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target_complex::text || idempotency_key::text, 0));
  select price_in_cents into current_total from public.courts where id = target_court and complex_id = target_complex for update;
  if not found then raise exception 'Access denied' using errcode = '42501'; end if;
  if not exists(select 1 from public.reservations where complex_id = target_complex and request_id = idempotency_key)
    and current_total <> expected_total then
    raise exception 'Price changed' using errcode = 'P0001';
  end if;
  return public.create_team_reservation(target_complex, target_court, target_date, target_minute, guest_name, guest_email, idempotency_key);
end;
$$;
revoke all on function public.create_quoted_team_reservation(uuid, uuid, date, integer, text, text, uuid, bigint) from public, anon;
grant execute on function public.create_quoted_team_reservation(uuid, uuid, date, integer, text, text, uuid, bigint) to authenticated;
commit;
