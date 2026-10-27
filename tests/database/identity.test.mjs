import { readFile, readdir } from 'node:fs/promises';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';

// PostgreSQL embebido: RLS/SQL reales; Auth mínimo simulado, no Supabase Auth.
const db = new PGlite();
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
  assert.equal(tables.rows.length, 5);
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
