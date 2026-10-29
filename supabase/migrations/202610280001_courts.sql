begin;
create table public.courts (
  id uuid primary key default gen_random_uuid(),
  complex_id uuid not null references public.complexes(id),
  name text not null check (length(trim(name)) between 2 and 80),
  sport text not null check (sport in ('football-5', 'football-6', 'padel')),
  duration_minutes integer generated always as (case when sport = 'padel' then 90 else 60 end) stored,
  price_in_cents bigint not null check (price_in_cents between 0 and 99999999999),
  currency text not null default 'ARS' check (currency = 'ARS'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (complex_id, id)
);
create index courts_complex on public.courts(complex_id);
alter table public.courts enable row level security;
create policy courts_member_read on public.courts for select to authenticated
  using (private.has_membership(complex_id));
create policy courts_member_insert on public.courts for insert to authenticated
  with check (private.has_membership(complex_id));
create policy courts_member_update on public.courts for update to authenticated
  using (private.has_membership(complex_id)) with check (private.has_membership(complex_id));
revoke all on public.courts from public, anon, authenticated;
grant select on public.courts to authenticated;
grant insert (complex_id, name, sport, price_in_cents) on public.courts to authenticated;
grant update (name, sport, price_in_cents, active) on public.courts to authenticated;
commit;
