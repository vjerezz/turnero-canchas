import { readFile, readdir } from 'node:fs/promises';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { randomUUID } from 'node:crypto';

// PostgreSQL embebido: RLS/SQL reales; Auth mínimo simulado, no Supabase Auth.
const db = new PGlite({ extensions: { btree_gist } });
const users = {
  ownerA: '00000000-0000-4000-8000-000000000001',
  ownerB: '00000000-0000-4000-8000-000000000002',
  admin: '00000000-0000-4000-8000-000000000003',
  guest: '00000000-0000-4000-8000-000000000004',
  unverified: '00000000-0000-4000-8000-000000000005',
};
let a, b;

async function as(role, user, query, params = []) {
  await db.exec(`set role ${role}`);
  try {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? '']);
    return await db.query(query, params);
  } finally {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}
const member = (user, query, params) => as('authenticated', user, query, params);
const denied = (operation) => assert.rejects(operation, (error) => error.code === '42501');
async function invite(complex = a, email = 'admin@example.com', owner = users.ownerA) {
  // Cada escenario funcional representa una emisión fuera de la ventana previa.
  // Solo altera fixtures de esta base embebida; la prueba del límite llama RPC directamente.
  await db.query("update public.team_invitations set created_at = least(created_at, now() - interval '61 seconds') where complex_id = $1", [complex]);
  return (await member(owner, 'select * from public.invite_administrator($1, $2)', [complex, email])).rows[0];
}
const accept = (user, token) => member(user, 'select public.accept_team_invitation($1) as id', [token]);

before(async () => {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  const migrationDir = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrationDir)).filter((file) => file.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrationDir), 'utf8'));
  }
  for (const [name, id] of Object.entries(users)) {
    await db.query('insert into auth.users values ($1, $2, $3)', [id, `${name}@example.com`, name === 'unverified' ? null : '2026-10-26T12:00:00Z']);
  }
  a = (await as('service_role', null, "select public.bootstrap_complex('Complejo A', 'complejo-a', $1, 'test:fixture-a') as id", [users.ownerA])).rows[0].id;
  b = (await as('service_role', null, "select public.bootstrap_complex('Complejo B', 'complejo-b', $1, 'test:fixture-b') as id", [users.ownerB])).rows[0].id;
}, { timeout: 30000 });
after(async () => db.close());

async function reservationFixture(price = 3000000, sport = 'football-5') {
  const court = (await member(users.ownerA, "insert into public.courts(complex_id,name,sport,price_in_cents) values ($1,'Reservas',$2,$3) returning id", [a, sport, price])).rows[0].id;
  await member(users.ownerA, 'select public.replace_court_weekly_hours($1,$2,0,$3)', [a, court, JSON.stringify(Array.from({ length: 7 }, (_, weekday) => ({ weekday, opens_minute: 1080, closes_minute: 1560 })))]);
  const date = (await db.query("select to_char((clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date + 2, 'YYYY-MM-DD') as date")).rows[0].date;
  const reserve = (minute = 1080, key = randomUUID(), user = users.ownerA, day = date, name = 'Jugador Prueba') => member(user,
    'select * from public.create_team_reservation($1,$2,$3,$4,$5,$6,$7)', [a, court, day, minute, name, 'jugador@example.com', key]);
  return { court, date, reserve };
}

test('reserva pendiente conserva precio, seña y plazo; reintento no duplica ni cambia cotización', async () => {
  const { court, reserve } = await reservationFixture();
  const key = randomUUID();
  const booking = (await reserve(1080, key)).rows[0];
  assert.equal(booking.status, 'pending_deposit');
  assert.equal(Number(booking.total_in_cents), 3000000);
  assert.equal(Number(booking.deposit_in_cents), 900000);
  assert.equal(new Date(booking.expires_at) - new Date(booking.created_at), 15 * 60000);
  await member(users.ownerA, 'update public.courts set price_in_cents=4000000 where id=$1', [court]);
  assert.deepEqual((await reserve(1080, key)).rows[0], booking);
  await assert.rejects(reserve(1140, key), e => e.code === '22023');
  assert.equal((await db.query('select * from public.reservation_events where reservation_id=$1', [booking.id])).rows.length, 1);
  await assert.rejects(reserve(), e => e.code === '23P01');
  assert.equal((await reserve(1140)).rows[0].status, 'pending_deposit');
});

test('reservas: aislamiento, usuario verificado, sin escrituras ni confirmación desde navegador', async () => {
  const { reserve } = await reservationFixture();
  const booking = (await reserve()).rows[0];
  for (const user of [users.ownerB, users.guest, users.unverified]) await denied(reserve(1140, randomUUID(), user));
  for (const table of ['reservations', 'court_occupancies', 'reservation_events']) {
    await denied(as('anon', null, `select * from public.${table}`));
    assert.equal((await member(users.ownerB, `select * from public.${table} where complex_id=$1`, [a])).rows.length, 0);
    await denied(member(users.ownerA, `delete from public.${table} where complex_id=$1`, [a]));
  }
  await denied(member(users.ownerA, "update public.reservations set status='confirmed' where id=$1", [booking.id]));
  await denied(member(users.ownerA, 'update public.court_occupancies set active=false where id=$1', [booking.id]));
});

test('vencimiento libera el turno al crear y deja historial; reintento vencido no crea otra reserva', async () => {
  const { reserve } = await reservationFixture();
  const key = randomUUID();
  const first = (await reserve(1080, key)).rows[0];
  await db.query("update public.reservations set created_at=now()-interval '16 minutes', expires_at=now()-interval '1 minute' where id=$1", [first.id]);
  const second = (await reserve()).rows[0];
  assert.notEqual(second.id, first.id);
  assert.equal((await reserve(1080, key)).rows[0].status, 'expired');
  assert.equal((await db.query('select active from public.court_occupancies where id=$1', [first.id])).rows[0].active, false);
  assert.deepEqual((await db.query('select event from public.reservation_events where reservation_id=$1 order by occurred_at', [first.id])).rows.map(r => r.event), ['created', 'expired']);
});

test('la exclusión común también impide bloqueos superpuestos; extremos contiguos son válidos', async () => {
  const { court, reserve } = await reservationFixture();
  const booking = (await reserve()).rows[0];
  await assert.rejects(db.query("insert into public.court_occupancies(complex_id,court_id,kind,starts_at,ends_at) select complex_id,court_id,'block',starts_at,ends_at from public.court_occupancies where id=$1", [booking.id]), e => e.code === '23P01');
  await db.query("insert into public.court_occupancies(complex_id,court_id,kind,starts_at,ends_at) select complex_id,court_id,'block',ends_at,ends_at+interval '1 hour' from public.court_occupancies where id=$1", [booking.id]);
  await assert.rejects(reserve(1140), e => e.code === '23P01');
  assert.equal((await db.query('select * from public.reservations where court_id=$1', [court])).rows.length, 1);
});

test('valida grilla, ventana, jornada cerrada y madrugada perteneciente a la apertura anterior', async () => {
  const { court, date, reserve } = await reservationFixture();
  for (const minute of [1079, 1081, 1560, -1]) await assert.rejects(reserve(minute), e => e.code === '22023');
  const dates = (await db.query("select to_char(current_date-2,'YYYY-MM-DD') as past, to_char(current_date+32,'YYYY-MM-DD') as future, to_char($1::date+1,'YYYY-MM-DD') as next", [date])).rows[0];
  await assert.rejects(reserve(1080, randomUUID(), users.ownerA, dates.past), e => e.code === '22023');
  await assert.rejects(reserve(1080, randomUUID(), users.ownerA, dates.future), e => e.code === '22023');
  await member(users.ownerA, 'insert into public.court_date_exceptions(complex_id,court_id,service_date,closed) values ($1,$2,$3,true)', [a, court, dates.next]);
  const night = (await reserve(1500)).rows[0];
  const occupancy = (await db.query("select to_char(starts_at at time zone 'America/Argentina/Buenos_Aires','YYYY-MM-DD HH24:MI') as local from public.court_occupancies where id=$1", [night.id])).rows[0];
  assert.equal(occupancy.local, `${dates.next} 01:00`);
  await assert.rejects(reserve(1080, randomUUID(), users.ownerA, dates.next), e => e.code === '22023');
  await assert.rejects(reserve(1500, randomUUID(), users.ownerA, dates.next), e => e.code === '22023');
});

test('seña usa enteros, redondea medio centavo hacia arriba y respeta 90 minutos de pádel', async () => {
  for (const [price, deposit] of [[1, 0], [5, 2], [15, 5], [99999999999, 30000000000]]) {
    const { reserve } = await reservationFixture(price, 'padel');
    const booking = (await reserve()).rows[0];
    assert.equal(Number(booking.deposit_in_cents), deposit);
    assert.equal(booking.duration_minutes, 90);
    await assert.rejects(reserve(1140), e => e.code === '22023');
    assert.equal((await reserve(1170)).rows[0].status, 'pending_deposit');
  }
});

test('alta atómica crea propietario y auditoría; error no deja complejo huérfano', async () => {
  assert.equal((await db.query('select * from private.onboarding_audit')).rows.length, 2);
  await assert.rejects(as('service_role', null, "select public.bootstrap_complex('Fallido', 'fallido', $1, '')", [users.ownerA]));
  assert.equal((await db.query("select * from public.complexes where slug = 'fallido'")).rows.length, 0);
  await assert.rejects(as('service_role', null, "select public.bootstrap_complex('No verificado', 'no-verificado', $1, 'test:unverified')", [users.unverified]));
});

test('visitante sin credenciales no lee tablas ni invoca funciones de equipo', async () => {
  for (const table of ['complexes', 'memberships', 'team_invitations']) {
    await denied(as('anon', null, `select * from public.${table}`));
  }
  await denied(as('anon', null, 'select * from public.invite_administrator($1, $2)', [a, 'guest@example.com']));
  await denied(as('anon', null, 'select public.accept_team_invitation($1)', ['x'.repeat(72)]));
});

test('A no lee B ni sus miembros; invitado autenticado sin membresía no ve nada', async () => {
  assert.deepEqual((await member(users.ownerA, 'select id from public.complexes')).rows, [{ id: a }]);
  assert.deepEqual((await member(users.ownerB, 'select id from public.complexes')).rows, [{ id: b }]);
  assert.equal((await member(users.ownerA, 'select * from public.memberships where complex_id = $1', [b])).rows.length, 0);
  assert.equal((await member(users.guest, 'select * from public.complexes')).rows.length, 0);
  assert.equal((await member(null, 'select * from public.complexes')).rows.length, 0);
});

test('no hay bootstrap público, ascenso de rol ni escrituras directas', async () => {
  await denied(member(users.ownerA, "select public.bootstrap_complex('Intruso', 'intruso', $1, 'test:attack')", [users.ownerA]));
  await denied(member(users.ownerA, "update public.memberships set role = 'owner' where complex_id = $1", [b]));
  await denied(member(users.ownerA, 'delete from public.memberships where complex_id = $1', [a]));
  await denied(member(users.ownerA, "insert into public.complexes(name, slug) values ('Intruso', 'intruso')"));
  await denied(member(users.ownerA, "update public.complexes set name = 'Intruso' where id = $1", [b]));
  await denied(member(users.ownerA, 'select * from private.invitation_credentials'));
  await denied(member(users.ownerA, 'select * from private.onboarding_audit'));
});

test('solo propietario de ese complejo puede invitar o revocar', async () => {
  await denied(invite(b, 'admin@example.com'));
  await denied(invite(a, 'admin@example.com', users.guest));
  await denied(member(users.ownerA, 'select public.revoke_administrator($1, $2)', [b, users.ownerB]));
});

test('invitación requiere destinatario verificado y token correcto; acepta una sola membresía', async () => {
  const invitation = await invite(a, ' ADMIN@example.com ');
  assert.equal(invitation.invitation_token.length, 72);
  await denied(accept(users.guest, invitation.invitation_token));
  await denied(accept(users.admin, 'x'.repeat(72)));
  assert.equal((await accept(users.admin, invitation.invitation_token)).rows[0].id, a);
  assert.equal((await accept(users.admin, invitation.invitation_token)).rows[0].id, a);
  assert.deepEqual((await member(users.admin, 'select complex_id, role from public.memberships')).rows, [{ complex_id: a, role: 'admin' }]);
  await denied(invite(a, 'guest@example.com', users.admin));
  assert.equal((await member(users.admin, 'select * from public.team_invitations')).rows.length, 0);
  await denied(member(users.admin, "update public.memberships set role = 'owner' where user_id = $1", [users.admin]));
});

test('usuario A+B tiene dos membresías y la revocación afecta solo un complejo', async () => {
  const invitation = await invite(b, 'admin@example.com', users.ownerB);
  await accept(users.admin, invitation.invitation_token);
  assert.equal((await member(users.admin, 'select * from public.complexes')).rows.length, 2);
  await member(users.ownerB, 'select public.revoke_administrator($1, $2)', [b, users.admin]);
  assert.deepEqual((await member(users.admin, 'select id from public.complexes')).rows, [{ id: a }]);
  await denied(accept(users.admin, invitation.invitation_token));
  // Una invitación nueva puede rehabilitar al administrador; la vieja no.
  const replacement = await invite(b, 'admin@example.com', users.ownerB);
  await accept(users.admin, replacement.invitation_token);
  assert.equal((await member(users.admin, 'select * from public.complexes')).rows.length, 2);
});

test('invitación vencida, revocada o reemplazada no concede acceso', async () => {
  const expired = await invite(a, 'guest@example.com');
  await db.query("update public.team_invitations set created_at = now() - interval '8 days', expires_at = now() - interval '1 day' where id = $1", [expired.invitation_id]);
  await denied(accept(users.guest, expired.invitation_token));
  const revoked = await invite(a, 'guest@example.com');
  await member(users.ownerA, 'select public.revoke_team_invitation($1, $2)', [a, revoked.invitation_id]);
  await denied(accept(users.guest, revoked.invitation_token));
  const replaced = await invite(a, 'guest@example.com');
  await invite(a, 'guest@example.com');
  await denied(accept(users.guest, replaced.invitation_token));
});

test('email no verificado y revocación cruzada no autorizan cambios', async () => {
  const unverified = await invite(a, 'unverified@example.com');
  await denied(accept(users.unverified, unverified.invitation_token));
  const invitation = await invite(b, 'guest@example.com', users.ownerB);
  await member(users.ownerA, 'select public.revoke_team_invitation($1, $2)', [a, invitation.invitation_id]);
  assert.equal((await accept(users.guest, invitation.invitation_token)).rows[0].id, b);
});

test('el propietario no puede revocarse ni ser degradado por una invitación', async () => {
  await member(users.ownerA, 'select public.revoke_administrator($1, $2)', [a, users.ownerA]);
  const invitation = await invite(a, 'ownerA@example.com');
  await accept(users.ownerA, invitation.invitation_token);
  assert.equal((await member(users.ownerA, 'select role from public.memberships where complex_id = $1 and user_id = $2', [a, users.ownerA])).rows[0].role, 'owner');
});

test('todas las tablas tienen RLS y ninguna función queda ejecutable por PUBLIC', async () => {
  const tables = await db.query("select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('public', 'private') and c.relkind = 'r'");
  assert.equal(tables.rows.length, 11);
  assert.ok(tables.rows.every((table) => table.relrowsecurity));
  const grants = await db.query("select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where n.nspname in ('public', 'private') and a.grantee = 0 and a.privilege_type = 'EXECUTE'");
  assert.deepEqual(grants.rows, []);
});

test('límite por complejo rechaza reintentos y conserva la invitación previa al hacer rollback', async () => {
  const original = await invite(a, 'guest@example.com');
  await assert.rejects(member(users.ownerA, 'select * from public.invite_administrator($1, $2)', [a, 'guest@example.com']), (error) => error.code === 'P0001');
  assert.equal((await db.query('select revoked_at from public.team_invitations where id = $1', [original.invitation_id])).rows[0].revoked_at, null);
  await member(users.ownerA, 'select public.revoke_team_invitation($1, $2)', [a, original.invitation_id]);
  await assert.rejects(member(users.ownerA, 'select * from public.invite_administrator($1, $2)', [a, 'other@example.com']), (error) => error.code === 'P0001');
  // El límite de A no impide emitir en B ni volver a emitir luego de la ventana.
  await invite(b, 'guest@example.com', users.ownerB);
  await invite(a, 'guest@example.com');
});

test('canchas: aislamiento, duración por deporte, precio y desactivación sin pérdida de datos', async () => {
  const court = (await member(users.ownerA, "insert into public.courts(complex_id,name,sport,price_in_cents) values ($1,'Cancha 1','padel',1500050) returning *", [a])).rows[0];
  assert.equal(court.duration_minutes, 90);
  assert.equal(Number(court.price_in_cents), 1500050);
  assert.equal((await member(users.ownerB, 'select * from public.courts where id=$1', [court.id])).rows.length, 0);
  await denied(member(users.ownerB, "insert into public.courts(complex_id,name,sport,price_in_cents) values ($1,'Intrusa','football-5',100)", [a]));
  assert.equal((await member(users.ownerB, "update public.courts set name='Intrusa' where id=$1 returning id", [court.id])).rows.length, 0);
  await denied(member(users.ownerA, 'update public.courts set complex_id=$1 where id=$2', [b, court.id]));
  await denied(member(users.ownerA, 'delete from public.courts where id=$1', [court.id]));
  await assert.rejects(member(users.ownerA, 'update public.courts set duration_minutes=30 where id=$1', [court.id]), (error) => error.code === '428C9');
  await assert.rejects(member(users.ownerA, 'update public.courts set price_in_cents=-1 where id=$1', [court.id]));
  await assert.rejects(member(users.ownerA, "update public.courts set sport='unknown' where id=$1", [court.id]));
  await member(users.ownerA, "update public.courts set sport='football-6',active=false where id=$1", [court.id]);
  const updated = (await member(users.ownerA, 'select * from public.courts where id=$1', [court.id])).rows[0];
  assert.equal(updated.active, false); assert.equal(updated.duration_minutes, 60);
  assert.equal(Number(updated.price_in_cents), 1500050);
  await denied(as('anon', null, 'select * from public.courts'));
});

test('administrador puede gestionar canchas y pierde acceso al revocar su membresía', async () => {
  const invitation = await invite(b, 'admin@example.com', users.ownerB);
  await accept(users.admin, invitation.invitation_token);
  const court = (await member(users.admin, "insert into public.courts(complex_id,name,sport,price_in_cents) values ($1,'Cancha B','football-5',10000) returning id", [b])).rows[0];
  await member(users.ownerB, 'select public.revoke_administrator($1,$2)', [b, users.admin]);
  assert.equal((await member(users.admin, 'select * from public.courts where id=$1', [court.id])).rows.length, 0);
  assert.equal((await member(users.admin, 'update public.courts set active=false where id=$1 returning id', [court.id])).rows.length, 0);
});

test('horarios: reemplazo atómico, aislamiento, medianoche y control de versión', async () => {
  const court = (await member(users.ownerA, "insert into public.courts(complex_id,name,sport,price_in_cents) values ($1,'Nocturna','padel',10000) returning id", [a])).rows[0];
  const rpc = (who, complex, version, windows) => member(who, 'select public.replace_court_weekly_hours($1,$2,$3,$4::jsonb)', [complex, court.id, version, JSON.stringify(windows)]);
  const original = [{ weekday: 6, opens_minute: 1080, closes_minute: 1560 }];
  await rpc(users.ownerA, a, 0, original);
  await denied(rpc(users.ownerB, b, 1, []));
  await denied(rpc(users.ownerB, a, 1, []));
  assert.equal((await member(users.ownerB, 'select * from public.court_weekly_hours where court_id=$1', [court.id])).rows.length, 0);
  await assert.rejects(rpc(users.ownerA, a, 0, []), (error) => error.code === '40001');
  await assert.rejects(rpc(users.ownerA, a, 1, [...original, { weekday: 0, opens_minute: 60, closes_minute: 180 }]), (error) => error.code === '23P01');
  await assert.rejects(rpc(users.ownerA, a, 1, [{ weekday: 0, opens_minute: 600, closes_minute: 500 }]));
  assert.deepEqual((await member(users.ownerA, 'select weekday, opens_minute, closes_minute from public.court_weekly_hours where court_id=$1', [court.id])).rows, original);
  assert.equal((await member(users.ownerA, 'select hours_version from public.courts where id=$1', [court.id])).rows[0].hours_version, 1);
  await denied(member(users.ownerA, 'delete from public.court_weekly_hours where court_id=$1', [court.id]));
  await denied(member(users.ownerA, 'update public.courts set hours_version=0 where id=$1', [court.id]));
  await rpc(users.ownerA, a, 1, [...original, { weekday: 0, opens_minute: 120, closes_minute: 240 }]);
  await rpc(users.ownerA, a, 2, []);
  assert.equal((await member(users.ownerA, 'select * from public.court_weekly_hours where court_id=$1', [court.id])).rows.length, 0);
});

test('excepciones: aislamiento, clave compuesta, validación y actualización sin mover cancha', async () => {
  const court = (await member(users.ownerA, "insert into public.courts(complex_id,name,sport,price_in_cents) values ($1,'Excepciones','football-5',3000000) returning id", [a])).rows[0].id;
  await member(users.ownerA, "insert into public.court_date_exceptions values ($1,$2,'2026-11-03',true,null,null)", [a,court]);
  assert.equal((await member(users.ownerB, 'select * from public.court_date_exceptions')).rows.length, 0);
  await denied(as('anon', null, 'select * from public.court_date_exceptions'));
  await denied(member(users.ownerB, "insert into public.court_date_exceptions values ($1,$2,'2026-11-04',true,null,null)", [a,court]));
  await assert.rejects(member(users.ownerB, "insert into public.court_date_exceptions values ($1,$2,'2026-11-04',true,null,null)", [b,court]), e => e.code === '23503');
  await assert.rejects(member(users.ownerA, "update public.court_date_exceptions set closed=false, opens_minute=1080, closes_minute=1080 where court_id=$1", [court]), e => e.code === '23514');
  await member(users.ownerA, 'update public.court_date_exceptions set closed=false, opens_minute=1080, closes_minute=1560 where court_id=$1', [court]);
  assert.equal((await member(users.ownerA, 'select closes_minute from public.court_date_exceptions where court_id=$1', [court])).rows[0].closes_minute,1560);
  await denied(member(users.ownerA, 'update public.court_date_exceptions set complex_id=$1 where court_id=$2', [b,court]));
  await denied(member(users.ownerA, 'delete from public.court_date_exceptions where court_id=$1', [court]));
});

test('restauración de excepción conserva datos y respeta el complejo', async () => {
  const court = (await member(users.ownerA, "insert into public.courts(complex_id,name,sport,price_in_cents) values ($1,'Restauración','football-5',100) returning id", [a])).rows[0].id;
  await member(users.ownerA, "insert into public.court_date_exceptions(complex_id,court_id,service_date,closed) values ($1,$2,'2026-12-01',true)", [a,court]);
  assert.equal((await member(users.ownerB, 'update public.court_date_exceptions set active=false where court_id=$1 returning *', [court])).rows.length,0);
  await member(users.ownerA, 'update public.court_date_exceptions set active=false where court_id=$1', [court]);
  assert.deepEqual((await member(users.ownerA, 'select active,closed from public.court_date_exceptions where court_id=$1', [court])).rows,[{active:false,closed:true}]);
  await member(users.ownerA, 'update public.court_date_exceptions set active=true where court_id=$1', [court]);
  assert.equal((await member(users.ownerA, 'select active from public.court_date_exceptions where court_id=$1', [court])).rows[0].active,true);
});
