-- Solo desarrollo. Datos transitorios: toda la prueba termina en ROLLBACK.
-- Ejecutar con Supabase CLI autenticado: db query --linked --file este-archivo.
begin;
create temporary table f04_fixture (name text primary key, id uuid, token text);
grant all on f04_fixture to authenticated, service_role;
insert into f04_fixture(name, id) values
  ('owner_a', gen_random_uuid()), ('owner_b', gen_random_uuid()),
  ('admin', gen_random_uuid()), ('guest', gen_random_uuid());
insert into auth.users(id, email, email_confirmed_at)
  select id, id::text || '@example.com', now() from f04_fixture;

set local role service_role;
insert into f04_fixture(name, id)
select 'complex_a', public.bootstrap_complex('Prueba transitoria A', 'test-' || gen_random_uuid(), id, 'test:f04:rollback')
  from f04_fixture where name = 'owner_a';
insert into f04_fixture(name, id)
select 'complex_b', public.bootstrap_complex('Prueba transitoria B', 'test-' || gen_random_uuid(), id, 'test:f04:rollback')
  from f04_fixture where name = 'owner_b';
reset role;

select set_config('request.jwt.claim.sub', (select id::text from f04_fixture where name = 'owner_a'), true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.complexes) <> 1 then raise exception 'Fuga de complejos'; end if;
  if (select count(*) from public.memberships) <> 1 then raise exception 'Fuga de membresías'; end if;
  begin
    perform public.invite_administrator((select id from f04_fixture where name = 'complex_b'), 'intruso@example.com');
    raise exception 'Invitación cruzada permitida';
  exception when insufficient_privilege then null; end;
  begin
    update public.memberships set role = 'owner';
    raise exception 'Escritura directa permitida';
  exception when insufficient_privilege then null; end;
  begin
    perform public.bootstrap_complex('Intruso', 'intruso', auth.uid(), 'test:unauthorized');
    raise exception 'Bootstrap público permitido';
  exception when insufficient_privilege then null; end;
end $$;
insert into f04_fixture(name, id, token)
select 'invitation', invitation_id, invitation_token from public.invite_administrator(
  (select id from f04_fixture where name = 'complex_a'),
  (select id::text || '@example.com' from f04_fixture where name = 'admin'));

select set_config('request.jwt.claim.sub', (select id::text from f04_fixture where name = 'guest'), true);
do $$ begin
  if (select count(*) from public.complexes) <> 0 then raise exception 'Invitado ve complejos privados'; end if;
  begin
    perform public.accept_team_invitation((select token from f04_fixture where name = 'invitation'));
    raise exception 'Destinatario incorrecto aceptado';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', (select id::text from f04_fixture where name = 'admin'), true);
select public.accept_team_invitation((select token from f04_fixture where name = 'invitation'));
select public.accept_team_invitation((select token from f04_fixture where name = 'invitation'));
do $$ begin
  if (select count(*) from public.memberships) <> 1 then raise exception 'Aceptación no idempotente'; end if;
  if (select count(*) from public.team_invitations) <> 0 then raise exception 'Administrador ve invitaciones'; end if;
  begin
    perform public.invite_administrator((select id from f04_fixture where name = 'complex_a'), 'intruso@example.com');
    raise exception 'Administrador pudo invitar';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', (select id::text from f04_fixture where name = 'owner_b'), true);
insert into f04_fixture(name, id, token)
select 'invitation_b', invitation_id, invitation_token from public.invite_administrator(
  (select id from f04_fixture where name = 'complex_b'),
  (select id::text || '@example.com' from f04_fixture where name = 'admin'));
select set_config('request.jwt.claim.sub', (select id::text from f04_fixture where name = 'admin'), true);
select public.accept_team_invitation((select token from f04_fixture where name = 'invitation_b'));
do $$ begin
  if (select count(*) from public.complexes) <> 2 then raise exception 'Usuario A+B sin ambos complejos'; end if;
end $$;

select set_config('request.jwt.claim.sub', (select id::text from f04_fixture where name = 'owner_a'), true);
select public.revoke_administrator((select id from f04_fixture where name = 'complex_a'), (select id from f04_fixture where name = 'admin'));
select set_config('request.jwt.claim.sub', (select id::text from f04_fixture where name = 'admin'), true);
do $$ begin
  if (select count(*) from public.complexes) <> 1 then raise exception 'Revocación afectó alcance incorrecto'; end if;
  if exists(select 1 from public.complexes where id = (select id from f04_fixture where name = 'complex_a')) then raise exception 'Acceso revocado permanece'; end if;
  begin
    perform public.accept_team_invitation((select token from f04_fixture where name = 'invitation'));
    raise exception 'Replay rehabilitó acceso revocado';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform 1 from public.memberships;
    raise exception 'Acceso anónimo permitido';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'F04: aislamiento y funciones verificados; fixtures revertidos' as result;
