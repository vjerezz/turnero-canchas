import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

// Opt-in: requiere proyecto de DESARROLLO vinculado y Supabase CLI autenticado.
// Usa conexiones remotas independientes. Los fixtures se eliminan en finally.
const ref = (await readFile('supabase/.temp/project-ref', 'utf8')).trim();
assert.equal(new URL(process.env.SUPABASE_URL).hostname, `${ref}.supabase.co`, 'El proyecto vinculado no coincide con .env.local');
const run = randomUUID();
const owner = randomUUID();
const complex = randomUUID();
const court = randomUUID();
const dir = `test-results/f06-concurrency-${run}`;
const cli = process.argv[2] ?? 'supabase';
await mkdir(dir, { recursive: true });
let sequence = 0;

async function query(sql) {
  const file = `${dir}/${++sequence}.sql`;
  await writeFile(file, sql);
  const args = ['db', 'query', '--linked', '--file', file];
  return new Promise((resolve, reject) => {
    // Ejecutable nativo, sin shell ni procesos pnpm/dlx entre las conexiones.
    const child = spawn(cli, args, { windowsHide: true });
    let output = '';
    let diagnostics = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Tiempo agotado en consulta de prueba')); }, 90000);
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { diagnostics += chunk; });
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        // Solo conservar SQLSTATE conocido; no imprimir mensajes del proveedor ni credenciales.
        resolve({ ok: false, exclusion: /23P01|exclusion constraint/.test(output + diagnostics), sqlstate: (output + diagnostics).match(/SQLSTATE[ :]*([A-Z0-9]{5})/)?.[1] });
        return;
      }
      try {
        const start = output.indexOf('{');
        const end = output.lastIndexOf('}');
        resolve({ ok: true, rows: JSON.parse(output.slice(start, end + 1)).rows });
      } catch { reject(new Error('Respuesta CLI inesperada; no se imprime por seguridad')); }
    });
  });
}

async function checked(sql) {
  const result = await query(sql);
  assert.ok(result.ok, 'Falló una consulta de preparación o verificación');
  return result.rows;
}

const date = "((clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date + 2)";
const booking = (minute, key) => `select id::text from public.create_team_reservation(
  '${complex}', '${court}', ${date}, ${minute}, 'Jugador ficticio', 'concurrency@example.com', '${key}');`;
const session = (name) => `begin; set local statement_timeout = '65s';
  set local application_name = '${name}';
  select set_config('request.jwt.claim.sub', '${owner}', true);
  set local role authenticated;`;

async function observe(predicate, message) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const rows = await checked(`select exists(select 1 from pg_stat_activity where ${predicate}) as observed;`);
    if (rows[0].observed) return;
  }
  throw new Error(message);
}

async function race(label, minute, sameKey = false, block = false) {
  const firstName = `f06-${run.slice(0, 8)}-${label}-a`;
  const secondName = `f06-${run.slice(0, 8)}-${label}-b`;
  assert.ok(Buffer.byteLength(firstName) <= 63 && Buffer.byteLength(secondName) <= 63,
    'application_name no debe truncarse en PostgreSQL');
  const key = randomUUID();
  const firstOperation = block ? `insert into public.court_occupancies(complex_id, court_id, kind, starts_at, ends_at)
    values ('${complex}', '${court}', 'block',
      (${date}::timestamp + make_interval(mins => ${minute})) at time zone 'America/Argentina/Buenos_Aires',
      (${date}::timestamp + make_interval(mins => ${minute + 60})) at time zone 'America/Argentina/Buenos_Aires');`
    : booking(minute, key);
  // Para probar la restricción común, el bloqueo usa el operador SQL; aún no hay RPC de bloqueo.
  const firstSql = block
    ? `begin; set local statement_timeout = '65s'; set local application_name = '${firstName}'; ${firstOperation}`
    : `${session(firstName)} ${firstOperation}`;
  console.log(`Iniciando ${label}: dos conexiones y observación de bloqueo en PostgreSQL.`);
  const first = query(`${firstSql} select pg_sleep(45); commit; select 'committed' as result;`);
  let second;
  try {
    // La CLI inicializa el rol de conexión antes de consultar. Separar ese arranque
    // evita que dos inicializaciones simultáneas interfieran; las transacciones
    // siguen solapadas y el bloqueo se verifica explícitamente más abajo.
    await new Promise((resolve) => setTimeout(resolve, 12000));
    await observe(`application_name = '${firstName}' and wait_event = 'PgSleep'`, 'No se observó la primera transacción abierta');
    second = query(`${session(secondName)} ${booking(minute, sameKey ? key : randomUUID())} commit; select 'committed' as result;`);
    await new Promise((resolve) => setTimeout(resolve, 12000));
    await observe(`application_name = '${secondName}' and exists (
      select 1 from pg_stat_activity blocker where blocker.application_name = '${firstName}'
        and blocker.pid = any(pg_blocking_pids(pg_stat_activity.pid)))`, 'No se demostró contención entre las dos conexiones de prueba');
    const [a, b] = await Promise.all([first, second]);
    assert.ok(a.ok, 'La primera transacción debe confirmar');
    if (sameKey) assert.ok(b.ok, 'El reintento concurrente debe recuperar la reserva');
    else assert.ok(!b.ok && b.exclusion, 'La segunda operación debe fallar por exclusión 23P01');
    const rows = await checked(`select
      (select count(*)::int from public.court_occupancies where court_id = '${court}' and active
        and starts_at = (${date}::timestamp + make_interval(mins => ${minute})) at time zone 'America/Argentina/Buenos_Aires') as occupancies,
      (select count(*)::int from public.reservations where court_id = '${court}' and start_minute = ${minute}) as reservations,
      (select count(*)::int from public.reservation_events e join public.reservations r on r.id = e.reservation_id
        where r.court_id = '${court}' and r.start_minute = ${minute}) as events;`);
    assert.deepEqual(rows[0], { occupancies: 1, reservations: block ? 0 : 1, events: block ? 0 : 1 });
    console.log(`OK ${label}: contención observada y una única ocupación activa.`);
  } finally {
    // Antes de limpiar, esperar que ambas transacciones terminen, incluso ante una aserción fallida.
    await Promise.allSettled([first, ...(second ? [second] : [])]);
  }
}

const cleanup = `begin;
  delete from public.reservation_events where complex_id = '${complex}';
  delete from public.reservations where complex_id = '${complex}';
  delete from public.court_occupancies where complex_id = '${complex}';
  delete from public.court_weekly_hours where complex_id = '${complex}';
  delete from public.courts where complex_id = '${complex}' and id = '${court}';
  delete from public.memberships where complex_id = '${complex}' and user_id = '${owner}';
  delete from public.complexes where id = '${complex}' and slug = 'f06-${run}';
  delete from auth.users where id = '${owner}' and email = '${run}@example.com';
  commit; select not exists(select 1 from public.complexes where id = '${complex}')
    and not exists(select 1 from auth.users where id = '${owner}') as clean;`;
// Guardar antes del alta: permite limpiar estos UUID aun si se interrumpe el proceso.
await writeFile(`${dir}/cleanup.sql`, cleanup);
try {
  await checked(`begin;
    insert into auth.users(id, email, email_confirmed_at) values ('${owner}', '${run}@example.com', now());
    insert into public.complexes(id, name, slug) values ('${complex}', 'Fixture concurrente F06', 'f06-${run}');
    insert into public.memberships(complex_id, user_id, role) values ('${complex}', '${owner}', 'owner');
    insert into public.courts(id, complex_id, name, sport, price_in_cents) values ('${court}', '${complex}', 'Fixture F06', 'football-5', 3000000);
    select set_config('request.jwt.claim.sub', '${owner}', true);
    set local role authenticated;
    select public.replace_court_weekly_hours('${complex}', '${court}', 0,
      (select jsonb_agg(jsonb_build_object('weekday', d, 'opens_minute', 1080, 'closes_minute', 1560)) from generate_series(0,6) d));
    commit; select 'ready' as result;`);
  await race('reserva-reserva', 1080);
  await race('reintento-idempotente', 1140, true);
  await race('bloqueo-reserva', 1200, false, true);
} finally {
  const rows = await checked(cleanup);
  assert.equal(rows[0].clean, true, `Revisar limpieza en ${dir}/cleanup.sql`);
  console.log('Fixtures de concurrencia eliminados; Soccer-v1 no fue utilizado.');
}
