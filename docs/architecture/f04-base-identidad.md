# F04 — Base de identidad y aislamiento

Fecha inicial: 26 de octubre de 2026. Estado: **migración aplicada y acceso del equipo integrado; F04 sigue abierta**.

## Continuación local — 27 de octubre de 2026

Verificación al 28 de octubre: 12 escenarios SQL embebidos y 65 pruebas unitarias aprobados (incluyen base de turnos/precios F05); lint general y TypeScript sin errores para el incremento, más revisión específica de los nuevos validadores de precio. La migración adicional de límite de invitaciones se aplicó y registró en Supabase el 28 de octubre; se verificó la existencia de la función remota.

Estado al 28 de octubre: Valen confirmó que la prueba de invitación funcionó. Esta confirmación no certifica por sí sola revocación, recuperación, aislamiento entre dos complejos ni sesión vencida. Se preparó `supabase/migrations/202610270001_invitation_rate_limit.sql`, aplicada en Supabase el 28 de octubre: serializa emisiones mediante bloqueo del complejo y rechaza altas dentro de un minuto incluso si se revocó la invitación anterior. La revocación de invitaciones previas que realiza el RPC también se revierte si el límite rechaza la nueva. Se verificaron 12 escenarios en PostgreSQL embebido; falta verificar contención con conexiones independientes en Supabase. El chequeo previo de la aplicación queda como ayuda de UX y la garantía final está implementada en la migración aplicada.

Inicialmente esta copia no tenía `.env.local`. Se configuró posteriormente con la URL y clave pública facilitadas por el usuario y Auth respondió HTTP 200. Esto verifica conectividad, no login ni membresías. No se modificaron cuentas remotas.

Se incorporó `src/features/auth/team-actions.ts`: acción de servidor para revocar administradores o invitaciones usando las funciones SQL existentes. Exige propietario vigente, valida tipo e identificador y obtiene el complejo del contexto autorizado; ignora el complejo enviado por el navegador. PostgreSQL conserva la autorización final y la protección del propietario. La acción todavía no está conectada a una pantalla. Se agregaron seis pruebas de permisos, entradas, alcance y errores; la suite unitaria completa aprobó 37 pruebas. Quedan pendientes UI y verificación autenticada real.

Se agregó `src/features/auth/session.test.ts` para verificar las guardas del servidor: configuración ausente, sesión ausente/vencida, email sin verificar, consulta de membresías vigentes por usuario, cookie ajena o inválida, complejo no legible, revocación entre peticiones, cambio entre complejos autorizados y fallo de la consulta. Supabase y las APIs de Next están simulados; estas pruebas no certifican correo, cookies reales, RLS remoto ni recorridos de navegador. F04 permanece abierta con los pendientes de alta, invitaciones y validación real descritos abajo.

Verificación inicial: `pnpm test` aprobó 31 pruebas (13 nuevas); después de agregar la acción de equipo aprobó 37. `pnpm lint` y `pnpm typecheck` finalizaron correctamente en ambos incrementos. pnpm preparó las dependencias del lockfile existente; no se cambiaron versiones. No se ejecutaron recorridos autenticados remotos ni de navegador.

## Actualización: conexión con Supabase

Verificación del adaptador de correo: 45 pruebas unitarias aprobadas; lint y TypeScript sin errores. Se simularon las respuestas del proveedor; no se verificaron entrega real ni presentación del formulario autenticado.

Emisión por correo: se agregó un adaptador HTTP de Resend y formulario en Equipo. Configurar `RESEND_API_KEY` e `INVITATION_FROM` (email simple autorizado) solo en `.env.local`; sin estas variables no se emiten tokens. La acción exige propietario, valida destinatario, genera el token mediante SQL y lo envía únicamente al proveedor por HTTPS, en texto plano con instrucciones para ingresar y pegar el código. Una respuesta aceptada no certifica entrega. Ante fallo o timeout se intenta revocar; si esa revocación falla se informa que debe revisarse la invitación pendiente. Hay una comprobación de una emisión por minuto/complejo: no es atómica y no garantiza contención entre solicitudes simultáneas; reforzar en SQL antes del piloto. Resend recibe email y credencial de invitación para entregarla. No se enviaron mensajes reales en esta entrega. El segundo email facilitado por el usuario queda para prueba manual, sin precargarlo en el código. Pendientes configurar proveedor/remitente, verificar cuenta destinataria y ejecutar recepción, aceptación y revocación reales. La creación de cuentas invitadas continúa siendo asistida.

Verificación de aceptación: `pnpm test` aprobó 41 pruebas; `pnpm lint` y `pnpm typecheck` finalizaron sin errores. Pendientes revisión visual y aceptación real con una segunda cuenta.

Continuación de aceptación: se incorporó `/admin/invitaciones/aceptar`, enlazada desde la selección de complejos. Requiere cuenta verificada, permite pegar un código recibido y llama a `accept_team_invitation` con el cliente de sesión. PostgreSQL verifica destinatario, vigencia y revocación; el servidor no devuelve el código ni detalles de errores. Al aceptar se actualiza el layout y se vuelve a elegir complejo. Este recorrido manual prepara la aceptación, pero no cierra la entrega por correo, el alta de cuentas invitadas ni las pruebas reales entre dos usuarios. El enlace de demo del panel ahora identifica explícitamente los datos ficticios de Los Álamos.

Actualización de interfaz del 27 de octubre: `/admin/equipo` conecta la acción de revocación con formularios de confirmación, estados de carga/error y listados reales de membresías e invitaciones. El enlace aparece para propietarios; el cargador de servidor también exige ese rol antes de consultar, filtra ambas tablas por el complejo autorizado y conserva RLS. Se muestran invitaciones aceptadas, revocadas, vencidas y pendientes. El email del integrante se obtiene de la invitación aceptada cuando existe; para altas sin invitación se muestra el identificador de cuenta. No hay todavía emisión ni entrega de invitaciones. Queda pendiente revisar visualmente la pantalla y probar revocaciones con una sesión real de propietario. Las pruebas unitarias existentes siguen aprobando (37).

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
