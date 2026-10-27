# F04 — Base de identidad y aislamiento

Fecha inicial: 26 de octubre de 2026. Estado: **migración aplicada y acceso del equipo integrado; F04 sigue abierta**.

## Actualización: conexión con Supabase

El usuario creó el proyecto de desarrollo y configuró `.env.local`, excluido de Git. Se verificó conectividad con Auth (HTTP 200), se vinculó el proyecto mediante Supabase CLI 2.122.0 y se aplicó `202610260001_identity.sql` después de revisar el dry run. Los tipos de `src/lib/supabase/database.types.ts` se generaron desde ese esquema remoto, no se escribieron a mano.

Se incorporaron `@supabase/supabase-js` 2.118.0 y `@supabase/ssr` 0.12.7, fijados en el lockfile. El cliente se crea por petición y usa la clave pública; no hay clave de servicio en el runtime web. La validación rechaza claves secretas y evita imprimir valores inválidos.

Rutas implementadas: `/admin/ingresar`, `/admin/recuperar-acceso`, `/auth/callback`, `/admin/nueva-contrasena`, `/admin/seleccionar-complejo` y `/admin`. El panel ahora exige usuario verificado y membresía vigente. El selector valida en servidor el ID recibido, y el panel vuelve a consultar la membresía antes de mostrar el complejo. Una cookie por sí sola no concede acceso.

El proxy renueva sesiones; cada operación protegida vuelve a verificar usuario mediante `getUser()` y membresías con RLS. Cookies HttpOnly, SameSite=Lax y Secure en producción; las respuestas de admin/Auth usan `private, no-store`. El cierre de sesión elimina el contexto con la misma ruta `/admin` con que fue creado. El callback PKCE usa un origen configurado y un destino fijo, sin redirecciones libres. La recuperación tiene respuesta genérica y la nueva contraseña requiere una sesión verificada, al menos 12 caracteres y confirmación coincidente.

La UI usa los componentes y tokens existentes. Se corrigió el nombre accesible del enlace de marca que detectó axe; no se desactivó la regla.

Se ejecutó `tests/database/remote-identity.sql` contra Supabase: aislamiento entre A/B, usuario A+B, invitado, permisos directos, bootstrap, destinatario de invitación, aceptación idempotente y revocación. Los usuarios y complejos de esa prueba solo existieron dentro de una transacción que terminó en ROLLBACK. Esta prueba usa roles/claims SQL controlados: todavía no certifica el recorrido HTTP autenticado ni la entrega de correo.

Pendientes para cerrar F04: cuenta inicial y alta del propietario con datos indicados por el usuario; configuración/verificación de URLs y correo de Auth; prueba de login/recuperación/salida/cambio de complejo con cuentas reales; UI y entrega de invitaciones del equipo; revocación y sesión vencida desde navegador; contención entre conexiones independientes. No se crearon cuentas reales ni se enviaron correos en esta entrega.

### Reproducir la conexión en otra máquina

Configurar `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` en `.env.local` con las claves del proyecto. Mantener `APP_URL` igual al origen con que se abrirá el navegador (desarrollo inicial: `http://localhost:3000`).

```powershell
pnpm dlx supabase@2.122.0 login
pnpm dlx supabase@2.122.0 link --project-ref TU_REFERENCIA
pnpm dlx supabase@2.122.0 db push --linked --dry-run
# Solo después de revisar las migraciones pendientes:
pnpm dlx supabase@2.122.0 db push --linked
pnpm dlx supabase@2.122.0 gen types typescript --linked --schema public | Set-Content -LiteralPath src/lib/supabase/database.types.ts -Encoding utf8
```

La referencia se obtiene del proyecto elegido; no es una contraseña. `supabase/.temp/` y `.env.local` están excluidos de Git. `supabase/config.toml` configura el entorno local, **no actualiza automáticamente Auth remoto**. No hay seed automático ni fixtures de usuarios persistentes. No ejecutar `db reset --linked` para actualizar el esquema.

En Authentication → URL Configuration, verificar Site URL `http://localhost:3000` y agregar `http://localhost:3000/auth/callback` a Redirect URLs para este entorno de desarrollo. Los enlaces PKCE deben abrirse en el navegador desde el que se pidió la recuperación. Para producción se definirán origen HTTPS y correo transaccional propios antes del piloto.

### Verificación del segundo incremento

- `pnpm test`: 18 pruebas aprobadas.
- `pnpm test:db`: 11 escenarios aprobados en PostgreSQL embebido.
- SQL de aislamiento remoto: aprobado y revertido al finalizar.
- `pnpm test:e2e`: 24 pruebas aprobadas en Chromium móvil/tablet/escritorio; incluye guardas sin sesión, cookie de complejo manipulada, callback sin destino externo, axe y capturas.
- `pnpm typecheck`, `pnpm lint`, `pnpm build` e instalación congelada: aprobados.
- Capturas de ingreso en móvil y escritorio inspeccionadas. Las pruebas E2E de presentación usan configuración pública ficticia; no envían correos ni prueban contraseñas contra Supabase real.

Las secciones siguientes registran el **primer incremento** y sus límites en ese momento; la actualización anterior reemplaza sus referencias a una base aún no conectada o un admin público.

## Alcance de este incremento

La migración `supabase/migrations/202610260001_identity.sql` crea complejos, membresías y metadatos de invitaciones. La identidad permanece en `auth.users`; no se copia el email del usuario a una ficha global de clientes. Un usuario puede pertenecer a varios complejos y tener distintos roles.

Las tablas públicas tienen RLS y permisos de solo lectura para usuarios autenticados: cada miembro ve sus complejos y membresías vigentes; el propietario ve el equipo y las invitaciones de su complejo. El visitante no tiene lectura de estas tablas. El catálogo público se construirá con una proyección explícita de campos publicados en F05/F08, no abriendo estas tablas.

No se habilita INSERT/UPDATE/DELETE directo desde la API. Las funciones comprueban identidad y propietario por complejo. Son `security definer` con `search_path` vacío y nombres de tablas calificados. Su privilegio se usa para evitar recursión RLS y realizar operaciones atómicas; no equivale a omitir autorización. No hay funciones ejecutables por PUBLIC.

## Operaciones implementadas en PostgreSQL

| Función | Autorización | Resultado |
| --- | --- | --- |
| `bootstrap_complex(name, slug, owner_id, operator_reference)` | Solo `service_role`; cuenta del propietario con email verificado | Crea complejo, propietario y registro de alta en una transacción |
| `invite_administrator(complex_id, email)` | Propietario activo de ese complejo | Emite invitación de administrador y revoca las pendientes anteriores para ese email/complejo |
| `accept_team_invitation(token)` | Destinatario autenticado con email verificado | Crea o rehabilita su membresía de administrador; no altera un propietario existente |
| `revoke_administrator(complex_id, user_id)` | Propietario activo de ese complejo | Revoca solo administradores, nunca el propietario |
| `revoke_team_invitation(complex_id, invitation_id)` | Propietario activo de ese complejo | Revoca la invitación pendiente dentro del alcance indicado |

La aceptación, emisión y revocación se serializan bloqueando la fila del complejo. El replay de una invitación aceptada devuelve el mismo complejo si la membresía sigue activa; no puede rehabilitar una membresía revocada. Una invitación nueva sí puede rehabilitar al administrador. El vencimiento solo impide la primera aceptación.

La credencial combina dos UUID aleatorios y se devuelve únicamente al emitir. Se guarda SHA-256 en `private.invitation_credentials`, sin permisos de lectura para equipo o visitante. La futura entrega deberá realizarse mediante correo; no registrar tokens ni incluirlos en analítica. El esquema `private` no debe agregarse a los esquemas expuestos por la API.

Se adopta una vigencia técnica inicial de **7 días para invitaciones del equipo**. No define vencimientos de reservas ni políticas comerciales. No hay transferencia de propiedad, eliminación de complejo ni rol de soporte.

Datos mínimos de esta entrega: nombre/slug del complejo; usuario, rol y fechas de membresía; email destinatario, emisor, destinatario verificado y fechas de invitación; hash de credencial; referencia del operador del alta. Retención, términos y procedimiento de eliminación siguen pendientes antes del piloto público. No se guardan teléfonos, documentos ni datos de jugadores.

## Pruebas reproducibles sin servicio externo

```powershell
pnpm install --frozen-lockfile
pnpm test:db
```

`tests/database/identity.test.mjs` ejecuta todas las migraciones ordenadas en una base nueva de PGlite 0.5.12 en memoria. Es PostgreSQL embebido con SQL, transacciones, privilegios y RLS reales. Solo se simula la infraestructura mínima de Auth: tabla de usuarios, roles y `auth.uid()`. Los datos de dos complejos son exclusivamente fixtures de prueba, no se cargan en la aplicación ni en una base remota.

Los 11 escenarios cubren alta atómica y auditoría, propietario verificado, denegación anónima, aislamiento A/B, usuario sin membresía, manipulación de rol, bloqueo de escrituras directas, alcance de funciones, aceptación/reintentos, usuario A+B, revocación, invitaciones vencidas/reemplazadas/revocadas, email no verificado, protección del propietario, RLS y privilegios EXECUTE.

**Límite:** esto no valida Supabase Auth, JWT, PostgREST, cookies, correo, caché del navegador ni concurrencia entre conexiones independientes. No sustituye las pruebas sobre Supabase. No se deben usar estos fixtures de Auth como migraciones de producción.

## Próximos pasos de F04

El usuario confirmó que todavía no tiene un proyecto Supabase de desarrollo. No se creó ningún recurso remoto ni se enviaron datos.

1. Crear un proyecto de desarrollo separado de producción. Guardar la contraseña de base y claves en un gestor de secretos, no en Git ni en el chat.
2. Aplicar la migración versionada en ese entorno vacío mediante Supabase CLI o el editor SQL. No editar únicamente el esquema remoto: cualquier cambio posterior requiere otra migración. No aplicar los fixtures de `tests/database`.
3. Generar los tipos TypeScript desde el esquema realmente aplicado y agregar el cliente Supabase tipado. No se entregan tipos escritos a mano como si fueran generados.
4. Configurar Auth del equipo, callbacks y URLs permitidas, verificación de email y recuperación. Crear/verificar la cuenta del propietario antes del alta asistida.
5. Invocar `bootstrap_complex` desde el procedimiento interno con credencial de servicio, pasando el ID verificado, nombre, slug y referencia del operador. Esa clave no se utilizará para las operaciones habituales del equipo ni estará en el navegador. No existe endpoint de bootstrap en la aplicación.
6. Integrar login, salida, recuperación, selector de complejo e invitaciones con controles de servidor por cada operación. La cookie de complejo seleccionado expresa intención, nunca autorización. Integrar entrega de invitaciones y límites de abuso antes de habilitarla al usuario.
7. Ejecutar pruebas reales con dos complejos por API y navegador: sesión vencida/revocada, cambios de contexto, IDs cruzados, invitaciones y correo. Probar contención con conexiones independientes.

La página `/admin` sigue siendo la presentación pública sin datos operativos de F01; `/demo/admin` sigue siendo la demostración F03. Este incremento no presenta una pantalla de login simulada como autenticación real.

## Referencias técnicas

- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Supabase: funciones, search_path y privilegios](https://supabase.com/docs/guides/database/functions).
- [PGlite: PostgreSQL en memoria para pruebas](https://pglite.dev/docs/).

## Verificaciones de la entrega

- Migración desde base vacía y suite SQL: 11 escenarios aprobados.
- Instalación con lockfile congelado: aprobada.
- `pnpm lint` y `pnpm typecheck`: aprobados.
- `pnpm test`: 8 pruebas aprobadas; junto a las 11 de `pnpm test:db`, 19 en este incremento.
- `git diff --check`: sin errores de whitespace; Git avisa normalización CRLF/LF en archivos existentes.
- No se repitieron build ni suites visuales: no se modificó código de aplicación, estilos o rutas.
- Sin aplicación remota, generación de tipos, autenticación real ni pruebas de Supabase ejecutadas.
