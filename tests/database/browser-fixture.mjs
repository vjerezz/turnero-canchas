// Opt-in, Supabase de desarrollo: fixture para probar UI con una sesión existente.
// No crea usuarios ni modifica credenciales. Ejecutar cleanup al terminar.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const [mode, cli, ownerEmail] = process.argv.slice(2);
assert.ok(['prepare', 'verify', 'cleanup'].includes(mode) && cli, 'Uso: browser-fixture.mjs prepare|verify|cleanup ruta-cli [email-propietario]');
const ref = (await readFile('supabase/.temp/project-ref', 'utf8')).trim();
assert.equal(new URL(process.env.SUPABASE_URL).hostname, `${ref}.supabase.co`);
const dir = 'test-results/f06-browser';
const manifestPath = `${dir}/manifest.json`;
await mkdir(dir, { recursive: true });
async function query(sql, name) {
  const file = `${dir}/${name}.sql`;
  await writeFile(file, sql);
  const output = await new Promise((resolve, reject) => {
    const child = spawn(cli, ['db', 'query', '--linked', '--file', file], { windowsHide: true });
    let text = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Consulta agotó el plazo')); }, 90000);
    child.stdout.on('data', (chunk) => { text += chunk; });
    child.stderr.resume();
    child.on('error', () => { clearTimeout(timer); reject(new Error('No se pudo iniciar la CLI')); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(text);
      else reject(new Error(`Consulta ${name} falló; revisar SQL guardado sin publicar credenciales`));
    });
  });
  return JSON.parse(output.slice(output.indexOf('{'), output.lastIndexOf('}') + 1)).rows;
}
if (mode === 'prepare') {
  assert.match(ownerEmail ?? '', /^[a-zA-Z0-9._+@-]+$/);
  const previous = await access(manifestPath).then(() => true, () => false);
  if (previous) assert.equal(JSON.parse(await readFile(manifestPath, 'utf8')).cleaned, true, 'Limpiar el fixture anterior antes de preparar otro');
  const fixture = { complex: randomUUID(), court: randomUUID(), ref, cleaned: false };
  const { complex, court } = fixture;
  await writeFile(manifestPath, JSON.stringify(fixture));
  await writeFile(`${dir}/cleanup.sql`, `begin;
    delete from public.reservation_events where complex_id='${complex}';
    delete from public.reservations where complex_id='${complex}';
    delete from public.court_occupancies where complex_id='${complex}';
    delete from public.court_date_exceptions where complex_id='${complex}';
    delete from public.court_weekly_hours where complex_id='${complex}';
    delete from public.courts where complex_id='${complex}' and id='${court}';
    delete from public.memberships where complex_id='${complex}';
    delete from public.complexes where id='${complex}' and slug='f06-browser-${complex}';
    commit;
    select not exists(select 1 from public.complexes where id='${complex}') as clean;`);
  try {
    await query(`begin;
      do $$ begin if (select count(*) from auth.users where email='${ownerEmail}' and email_confirmed_at is not null) <> 1 then raise exception 'Propietario verificado requerido'; end if; end $$;
      insert into public.complexes(id,name,slug) values ('${complex}','Prueba aislada F06','f06-browser-${complex}');
      insert into public.memberships(complex_id,user_id,role) select '${complex}',id,'owner' from auth.users where email='${ownerEmail}';
      insert into public.courts(id,complex_id,name,sport,price_in_cents) values ('${court}','${complex}','Cancha de prueba F06','football-5',3000000);
      insert into public.court_weekly_hours(complex_id,court_id,weekday,opens_minute,closes_minute) select '${complex}','${court}',d,1080,1560 from generate_series(0,6) d;
      commit; select 'ready' as result;`, 'prepare');
    console.log('Fixture Prueba aislada F06 preparado; seleccionar desde el panel. Cleanup SQL guardado antes del alta.');
  } catch (error) {
    const rows = await query(await readFile(`${dir}/cleanup.sql`, 'utf8'), 'cleanup');
    assert.equal(rows[0].clean, true);
    await writeFile(manifestPath, JSON.stringify({ ...fixture, cleaned: true }));
    throw error;
  }
} else {
  const fixture = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.equal(fixture.ref, ref);
  assert.match(fixture.complex, /^[0-9a-f-]{36}$/);
  if (mode === 'cleanup') {
    const rows = await query(await readFile(`${dir}/cleanup.sql`, 'utf8'), 'cleanup');
    assert.equal(rows[0].clean, true);
    await writeFile(manifestPath, JSON.stringify({ ...fixture, cleaned: true }));
    console.log('Fixture eliminado. Usuario original y Soccer-v1 conservados.');
  } else {
    const rows = await query(`select (select count(*)::int from public.reservations where complex_id='${fixture.complex}') as reservations,
      (select count(*)::int from public.court_occupancies where complex_id='${fixture.complex}' and active) as occupancies,
      (select count(*)::int from public.reservation_events where complex_id='${fixture.complex}' and event='created') as created_events;`, 'verify');
    assert.deepEqual(rows[0], { reservations: 1, occupancies: 1, created_events: 1 });
    console.log(JSON.stringify(rows));
  }
}
