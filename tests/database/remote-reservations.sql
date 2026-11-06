-- Desarrollo: prueba SQL contra Supabase. Todo fixture se revierte al finalizar.
-- No equivale a una prueba de concurrencia entre conexiones ni de Supabase Auth.
begin;
create temporary table f06_fixture (
  owner_a uuid, owner_b uuid, complex_a uuid, complex_b uuid, court_a uuid,
  service_date date, request_id uuid, booking_id uuid
);
grant all on f06_fixture to authenticated;
insert into f06_fixture(owner_a, owner_b, service_date, request_id)
values (gen_random_uuid(), gen_random_uuid(),
  (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date + 2, gen_random_uuid());
insert into auth.users(id, email, email_confirmed_at)
select owner_a, owner_a::text || '@example.com', now() from f06_fixture
union all select owner_b, owner_b::text || '@example.com', now() from f06_fixture;
update f06_fixture set
  complex_a = public.bootstrap_complex('Prueba F06 A', 'f06-' || owner_a, owner_a, 'test:f06:rollback'),
  complex_b = public.bootstrap_complex('Prueba F06 B', 'f06-' || owner_b, owner_b, 'test:f06:rollback');
with inserted as (
  insert into public.courts(complex_id, name, sport, price_in_cents)
  select complex_a, 'Cancha transitoria F06', 'football-5', 3000000 from f06_fixture returning id
) update f06_fixture set court_a = (select id from inserted);

select set_config('request.jwt.claim.sub', (select owner_a::text from f06_fixture), true);
set local role authenticated;
select public.replace_court_weekly_hours(complex_a, court_a, 0,
  (select jsonb_agg(jsonb_build_object('weekday', d, 'opens_minute', 1080, 'closes_minute', 1560)) from generate_series(0, 6) d))
from f06_fixture;

do $$
declare f record; first_booking public.reservations; replay public.reservations; availability jsonb;
begin
  select * into f from f06_fixture;
  availability := public.get_team_availability(f.complex_a, f.court_a, f.service_date);
  if availability->'slots'->0->>'state' <> 'available' then raise exception 'Turno inicial no disponible'; end if;
  first_booking := public.create_quoted_team_reservation(f.complex_a, f.court_a, f.service_date, 1080,
    'Jugador de prueba', 'test@example.com', f.request_id, 3000000);
  availability := public.get_team_availability(f.complex_a, f.court_a, f.service_date);
  if availability->'slots'->0->>'state' <> 'occupied' or availability::text like '%test@example.com%'
    then raise exception 'Disponibilidad incorrecta o fuga de cliente'; end if;
  if first_booking.status <> 'pending_deposit' or first_booking.total_in_cents <> 3000000
    or first_booking.deposit_in_cents <> 900000 or first_booking.expires_at - first_booking.created_at <> interval '15 minutes'
    then raise exception 'Precio, seña o plazo incorrectos'; end if;
  update f06_fixture set booking_id = first_booking.id;
  update public.courts set price_in_cents = 4000000 where id = f.court_a;
  replay := public.create_quoted_team_reservation(f.complex_a, f.court_a, f.service_date, 1080,
    'Jugador de prueba', 'test@example.com', f.request_id, 3000000);
  if replay is distinct from first_booking then raise exception 'Reintento cambió reserva/cotización'; end if;
  begin
    perform public.create_team_reservation(f.complex_a, f.court_a, f.service_date, 1140,
      'Jugador de prueba', 'test@example.com', f.request_id);
    raise exception 'Aceptó reutilizar clave con otro contenido';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.create_team_reservation(f.complex_a, f.court_a, f.service_date, 1080,
      'Otro jugador', 'test2@example.com', gen_random_uuid());
    raise exception 'Permitió superposición';
  exception when exclusion_violation then null; end;
  perform public.create_team_reservation(f.complex_a, f.court_a, f.service_date, 1140,
    'Jugador contiguo', 'adjacent@example.com', gen_random_uuid());
  begin
    update public.reservations set status = 'confirmed' where id = first_booking.id;
    raise exception 'Permitió confirmar desde cliente';
  exception when insufficient_privilege then null; end;
  begin
    update public.court_occupancies set active = false where id = first_booking.id;
    raise exception 'Permitió liberar desde cliente';
  exception when insufficient_privilege then null; end;
  begin
    perform public.create_team_reservation(f.complex_a, f.court_a, f.service_date + 40, 1080,
      'Jugador de prueba', 'test@example.com', gen_random_uuid());
    raise exception 'Aceptó fecha fuera del horizonte';
  exception when invalid_parameter_value then null; end;
end $$;

select set_config('request.jwt.claim.sub', (select owner_b::text from f06_fixture), true);
do $$ declare f record; begin
  select * into f from f06_fixture;
  if exists(select 1 from public.reservations where complex_id = f.complex_a)
    or exists(select 1 from public.court_occupancies where complex_id = f.complex_a)
    or exists(select 1 from public.reservation_events where complex_id = f.complex_a)
    then raise exception 'Fuga entre complejos'; end if;
  begin
    perform public.create_team_reservation(f.complex_a, f.court_a, f.service_date, 1200,
      'Intruso', 'intruso@example.com', gen_random_uuid());
    raise exception 'Creación cruzada permitida';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Vencer solo la reserva ficticia dentro de esta transacción.
update public.reservations set created_at = now() - interval '16 minutes', expires_at = now() - interval '1 minute'
where id = (select booking_id from f06_fixture);
do $$ begin
  begin
    insert into public.court_occupancies(complex_id, court_id, kind, starts_at, ends_at)
    select complex_id, court_id, 'block', starts_at, ends_at from public.court_occupancies
    where id = (select booking_id from f06_fixture);
    raise exception 'Bloqueo superpuesto permitido';
  exception when exclusion_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub', (select owner_a::text from f06_fixture), true);
set local role authenticated;
do $$ declare f record; replacement public.reservations; replay public.reservations; begin
  select * into f from f06_fixture;
  replacement := public.create_team_reservation(f.complex_a, f.court_a, f.service_date, 1080,
    'Nuevo jugador', 'new@example.com', gen_random_uuid());
  replay := public.create_team_reservation(f.complex_a, f.court_a, f.service_date, 1080,
    'Jugador de prueba', 'test@example.com', f.request_id);
  if replacement.id = f.booking_id or replay.id <> f.booking_id or replay.status <> 'expired'
    then raise exception 'Vencimiento o replay incorrecto'; end if;
  if (select active from public.court_occupancies where id = f.booking_id)
    then raise exception 'Ocupación vencida sigue activa'; end if;
  if (select count(*) from public.reservation_events where reservation_id = f.booking_id) <> 2
    then raise exception 'Auditoría incorrecta'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin perform 1 from public.reservations; raise exception 'Lectura anónima permitida';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'F06: restricciones, permisos, idempotencia y vencimiento verificados; fixtures revertidos' as result;
