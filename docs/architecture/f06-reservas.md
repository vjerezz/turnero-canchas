# F06 — Motor de reservas pendientes

## Reglas confirmadas el 29 de octubre de 2026

Equipo y jugadores esperan una seña del 30% durante 15 minutos. Precio y seña se guardan en centavos de ARS, con redondeo al centavo más cercano (mitad hacia arriba). El reloj de PostgreSQL define la creación y el vencimiento. El precio histórico no cambia cuando se edita la cancha. Los pagos tardíos requieren revisión del propietario, sin confirmar automáticamente ni recuperar un turno ocupado por otra persona.

## Incremento implementado

Migración `202610290003_pending_reservations.sql`, aplicada al Supabase de desarrollo el 31 de octubre de 2026:

- `court_occupancies` reúne intervalos de reservas y futuros bloqueos. Una exclusión GiST con `btree_gist` prohíbe superposición activa en la misma cancha, con extremos `[inicio, fin)`. No depende de una consulta previa del navegador.
- `reservations` conserva cliente, fecha de apertura, precio, duración, seña, plazo, operador y clave de idempotencia. Estados previstos: `pending_deposit`, `confirmed`, `expired`. Solo se implementan creación pendiente y vencimiento; no existe una operación de confirmación expuesta al navegador.
- `reservation_events` registra creación y vencimiento sin permisos de modificación para el equipo. Las tres tablas tienen RLS y lectura limitada a miembros vigentes del complejo; no admiten escrituras directas desde clientes.
- `create_team_reservation` verifica membresía, cancha activa, horario semanal/excepción, grilla por duración, conflictos entre jornadas y anticipación inclusiva de 2 horas a 720 horas. Convierte la fecha y los minutos de servicio usando `America/Argentina/Buenos_Aires`.
- Una clave por complejo permite reintentar exactamente la misma solicitud sin duplicar ni extender su espera. Reutilizarla con otro contenido u operador falla. Se serializan la clave y la cancha. Horarios semanales, cambios de cancha y excepciones comparten el bloqueo de cancha con la creación.
- Al intentar crear o recuperar una reserva se vencen y liberan las pendientes de esa cancha cuyo plazo terminó, dentro de la misma transacción. El reintento de una reserva vencida devuelve esa reserva, no genera otra.

El vencimiento persistido es **por demanda**, no un proceso periódico. Una lectura directa de tablas puede mostrar una pendiente cuyo plazo ya terminó; la disponibilidad integrada el 6 de noviembre la descuenta según `expires_at` y el reloj de PostgreSQL. Una creación válida libera primero esos intervalos. Si la operación completa falla, sus cambios se revierten juntos.

## Verificación y límites

Pruebas con PostgreSQL embebido PGlite y extensión real `btree_gist`: precio/seña/plazo, reintento y cambio de contenido, aislamiento, escrituras prohibidas, exclusión entre reservas y bloqueos, extremos contiguos, expiración y auditoría, madrugada por jornada, ventana de anticipación, redondeo y duración de pádel. No equivalen a una prueba concurrente entre conexiones independientes ni a Supabase Auth/PostgREST de extremo a extremo.

Pendientes: conectar formulario y agenda del equipo; disponibilidad que considere reservas/bloqueos y vencimientos; flujo invitado y enlace privado; integración de Mercado Pago, confirmación idempotente e incidencias de pago tardío. Se verificaron tres casos concurrentes entre conexiones independientes (registro abajo); no incluye carreras futuras de pago/vencimiento o reprogramación. Los precios cuya seña redondea a cero permanecen pendientes: no se inventó una exención automática de pago. Cancelación, reprogramación, devoluciones y registro manual de cobros aún requieren reglas explícitas.

## Aplicación y verificación remota — 31 de octubre de 2026

Se comprobó que el proyecto vinculado coincide con la URL configurada en `.env.local`. El dry run de Supabase CLI 2.122.0 encontró únicamente la migración de reservas pendiente. Se aplicó con `db push --linked --yes`; el segundo dry run devolvió `upToDate: true` y ninguna migración pendiente. No se modificaron las migraciones ya aplicadas ni se reinició la base.

Se agregó `tests/database/remote-reservations.sql` y se ejecutó contra Supabase. Crea usuarios, complejos y cancha ficticios dentro de una transacción que termina en `ROLLBACK`. Comprueba seña/plazo/precio histórico, reintento idempotente, rechazo de clave con otro contenido, superposición y turnos contiguos, permisos de lectura/escritura, imposibilidad de confirmar desde cliente, horizonte máximo, conflicto reserva/bloqueo, vencimiento por demanda y auditoría. No crea reservas persistentes en Soccer-v1 ni modifica sus horarios o excepciones.

Para repetir esta verificación en desarrollo, con la CLI autenticada y el proyecto correcto vinculado:

```powershell
pnpm dlx supabase@2.122.0 db query --linked --file tests/database/remote-reservations.sql
```

Los tipos `src/lib/supabase/database.types.ts` se regeneraron desde el esquema remoto completo. Se eliminó `app-database.ts`: el cliente y el formulario de cancha usan los tipos generados. PostgreSQL publica `sport` como texto con CHECK, no como enum; las páginas validan su valor mediante el esquema Zod existente antes de usarlo para etiquetas y horarios, sin forzar tipos con casts.

Verificación de este incremento:

- `pnpm test:db`: 23 escenarios aprobados.
- Prueba SQL remota: aprobada; datos ficticios revertidos.
- `pnpm test`: 124 pruebas aprobadas.
- `pnpm typecheck`, `pnpm lint` y `pnpm build`: aprobados.
- Sin cambios de maquetación ni nuevas rutas; no se repitieron las suites visuales.

La prueba remota usa roles y claims controlados desde SQL. **No demuestra concurrencia entre conexiones independientes ni el recorrido HTTP autenticado.** F06 continúa abierta; el siguiente incremento debe verificar concurrencia y conectar disponibilidad/creación administrativa sin presentar los turnos de F05 como disponibles antes de consultar ocupaciones.

## Verificador de concurrencia remota

Se agregó `tests/database/remote-concurrency.mjs` y el comando optativo `pnpm test:db:concurrency`. Requiere `.env.local`, proyecto Supabase **de desarrollo** vinculado, sesión CLI autenticada y el ejecutable nativo de Supabase 2.122.0. La URL de entorno debe corresponder al proyecto vinculado; el verificador lo comprueba antes de crear fixtures.

Si `supabase` está en PATH como ejecutable nativo:

```powershell
pnpm test:db:concurrency
```

Si se instaló mediante un gestor que utiliza un wrapper, pasar la ruta del binario nativo:

```powershell
pnpm test:db:concurrency "C:\ruta\supabase.exe"
```

No se agregan contraseñas PostgreSQL ni claves de servicio al entorno. Cada consulta se ejecuta con un proceso CLI independiente, sin shell. El verificador crea un usuario, un complejo y una cancha ficticios identificados por UUID; **estos fixtures se confirman temporalmente** para ser visibles a varias conexiones. No usa Soccer-v1. En `finally` elimina las filas de esos UUID, en orden de dependencias, y verifica la limpieza. Antes de crear datos guarda un SQL de recuperación limitado a esos UUID en `test-results/f06-concurrency-<uuid>/cleanup.sql`, excluido de Git, por si se interrumpe el proceso.

Casos: dos reservas distintas para el mismo intervalo (solo una inserción persiste y la otra recibe exclusión `23P01`), dos reintentos con la misma clave (una reserva y un evento), y bloqueo contra reserva (una ocupación, ninguna reserva nueva). La primera transacción permanece abierta durante 45 segundos; se exige observar `PgSleep` y luego que `pg_blocking_pids` identifique a esa conexión como bloqueadora de la segunda. No basta con que dos solicitudes hayan sido lanzadas desde JavaScript.

La prueba de bloqueo escribe el fixture como operador SQL, porque todavía no existe una operación administrativa de bloqueo expuesta al equipo. No confirma reservas por pago ni prueba Auth HTTP. Los tres casos pueden tardar varios minutos.

### Resultado de ejecución — 31 de octubre de 2026

Suite completa ejecutada con Supabase CLI nativo 2.122.0: **3 casos aprobados, salida 0**.

| Carrera | Evidencia comprobada |
| --- | --- |
| Reserva contra reserva | Segunda conexión bloqueada por la primera; una reserva pendiente y una ocupación activa; la segunda operación falla por exclusión |
| Reintento con la misma clave | Segunda conexión bloqueada por la primera; ambas operaciones terminan correctamente; una reserva, una ocupación y un evento de creación |
| Bloqueo contra reserva | Segunda conexión bloqueada por la primera; queda el bloqueo y no se crea una reserva superpuesta |

La limpieza final eliminó usuario, membresía, complejo, cancha, horarios, ocupaciones, reservas y eventos de los UUID generados. Se comprobó que usuario y complejo ficticios ya no existían. No se usaron canchas de Soccer-v1, no se enviaron correos ni se procesaron pagos.

Durante el desarrollo del verificador se corrigieron dos problemas de observación: arranques simultáneos de la CLI que no permitían observar la primera conexión e identificadores de conexión que PostgreSQL truncaba a 63 bytes. El ejecutor usa el binario nativo, separa el arranque de conexiones y valida la longitud del identificador; sigue exigiendo contención real entre las dos conexiones identificadas. Los intentos fallidos no se contabilizan como pruebas aprobadas y también se limpiaron sus fixtures.

`node --check`, lint y `git diff --check` sin errores (Git conserva avisos CRLF/LF). No se repitió build ni la suite de interfaz en este incremento: solo se agregó el verificador, su comando y documentación. La configuración de aplicación/Supabase de `.env.local` se validó sin mostrar valores y se comprobó que Git la excluye.

Siguiente incremento registrado al 31/10: integrar disponibilidad calculada con ocupaciones y vencimientos, y el formulario administrativo con recuperación de conflictos/reintentos. Ver actualización siguiente.

## Disponibilidad y formulario administrativo — 6 de noviembre de 2026

Antes de continuar se ejecutó `git fetch origin --prune`: `HEAD...origin/main` devolvió `0 0`. No había novedades remotas que integrar; se conservaron los cambios locales sin commit ni push.

Migración `202610310001_team_availability.sql` aplicada a Supabase y tipos regenerados. `get_team_availability` valida membresía y alcance, usa el reloj de PostgreSQL y combina horarios, excepciones, superposiciones de jornadas, ocupaciones y vencimientos. No devuelve nombres ni emails de reservas. No persiste vencimientos durante la lectura.

La pantalla `/admin/canchas/[id]/turnos` consulta esa función y distingue disponible, ocupado, fuera de plazo, jornada cerrada, cancha inactiva y horarios en conflicto. Solo ofrece reservar turnos disponibles; la creación vuelve a validar todo en una transacción.

La nueva ruta `/admin/canchas/[id]/reservar` pide nombre/email y muestra total/seña. Una UUID generada en servidor queda en la URL de la solicitud para conservar la idempotencia al recargar. Esa UUID no autoriza lectura: recuperar el resultado requiere sesión, membresía, complejo, cancha y operador original. Una reserva recuperada muestra su precio histórico y estado efectivo según el reloj de la base.

`create_quoted_team_reservation` mantiene el orden de locks del motor y rechaza un precio distinto del mostrado antes de crear; los reintentos devuelven la reserva original. La acción deriva el complejo de la sesión, valida entradas y presenta errores de acceso, conflicto, cambio de precio o resultado incierto sin filtrar detalles SQL. El formulario conserva nombre/email ante errores. Un cambio de precio exige recargar y revisar antes de enviar otra vez.

Verificación ejecutada:

- 25 pruebas SQL embebidas aprobadas.
- Prueba remota con creación cotizada, disponibilidad ocupada y recuperación del precio histórico aprobada; fixtures revertidos con rollback.
- 136 pruebas unitarias aprobadas, incluidas 12 nuevas de validación, alcance, errores y reintentos de la acción.
- Typecheck, lint y build aprobados.
- 24 pruebas Playwright de regresión pública/acceso aprobadas en 390, 768 y 1280 px; luego 3 pruebas dirigidas de acceso aprobadas incluyendo las nuevas rutas de turnos/reserva.

Límites de ese incremento: no había una sesión autenticada abierta en el navegador disponible. Las pruebas públicas no sustituyen el recorrido HTTP autenticado. No se repitieron las tres carreras remotas anteriores; la nueva envoltura utiliza los mismos locks y delega la creación al motor verificado. No se agregaron cobros, emails, confirmación manual, cancelaciones ni agenda. F06 sigue abierta.

### Revisión del formulario y corrección de hidratación — 6 de noviembre de 2026

Se agregó `/dev/reservas`, exclusivamente en desarrollo, para ejercitar el componente real con una acción simulada sin persistencia. No llama a Supabase ni crea reservas. La acción real conserva sus comprobaciones de sesión, alcance y SQL; la simulación no agrega una vía de autorización. Los casos cubren conflicto, precio cambiado y resultado incierto, carga, conservación de nombre/email y reintentos por teclado.

WebKit reveló una pérdida de texto antes de la hidratación: el campo nombre aceptaba la escritura antes de que React conectara sus eventos y luego volvía a vacío. Se diagnosticó verificando valores y validación nativa, no suponiendo un fallo de teclado. El formulario ahora habilita los controles al completar la hidratación mediante `useSyncExternalStore`; durante la espera muestra «Preparando formulario». También se normalizan espacios y mayúsculas del email antes de validarlo en servidor.

Resultados: cuatro recorridos Playwright aprobados (Chromium 390/768/1280 px y WebKit 390 px), sin infracciones detectadas por axe en los estados comprobados y sin desbordamiento horizontal. Se inspeccionaron las capturas móvil/escritorio en `test-results/ui/` (ignoradas por Git). 137 pruebas unitarias, typecheck, lint y build aprobados. Tres pruebas adicionales comprobaron que `/dev/reservas` y los fixtures de demo devuelven 404 en producción. Los primeros intentos fallidos fueron diagnosticados y no se cuentan como aprobados.

La sesión inicial de Chrome no se compartía con el navegador integrado. El control de Chrome se interrumpió al no poder verificar su URL; no se extrajeron cookies ni credenciales para sustituir ese acceso.

### Revisión autenticada de lectura — 6 de noviembre de 2026

El usuario inició sesión en el navegador integrado. Se verificó el recorrido real: selección de Soccer-v1 como propietario → canchas → disponibilidad de Cancha 1 → formulario de las 18:00. La jornada del 06/11 mostró ocho turnos desde las 18:00 hasta las 02:00 del día siguiente. El formulario consultó precio real de ARS 30.000 y seña de ARS 9.000; recargar conservó la misma URL y clave de solicitud.

Se inspeccionó el panel autenticado en anchos CSS efectivos de 390 y 1280 px, medidos con `innerWidth` debido al escalado del navegador integrado. Sin desbordamiento horizontal; controles y botón principal de aproximadamente 48 px en móvil. Se restauró el tamaño original al terminar y se dejó abierto el formulario.

Esta revisión de lectura no envió el formulario ni modificó Soccer-v1. El recorrido de escritura se verificó después con fixtures aislados, según el registro siguiente.

### Recorrido HTTP autenticado con datos aislados — 6 de noviembre de 2026

Se agregó `tests/database/browser-fixture.mjs`: prepara un complejo/cancha identificados por UUID para una cuenta existente verificada, comprueba resultados y permite limpiar el fixture. Requiere Supabase de desarrollo vinculado, `.env.local` y ejecutable CLI nativo 2.122.0. Comprueba que URL y proyecto vinculado coincidan. No crea usuarios, contraseñas ni claves; la membresía temporal solo permite probar ese complejo ficticio. Antes del alta guarda el SQL de limpieza en `test-results/f06-browser/cleanup.sql`, ignorado por Git. Si falla la preparación intenta limpiar; si se interrumpe la revisión debe ejecutarse cleanup.

Uso desde PowerShell (email y ruta de ejemplo):

```powershell
node --env-file=.env.local tests/database/browser-fixture.mjs prepare C:\ruta\supabase.exe propietario@example.com
# En el panel: elegir Prueba aislada F06 y abrir dos solicitudes del mismo turno.
# Crear la primera, enviar la segunda, recargar la primera y volver a disponibilidad.
node --env-file=.env.local tests/database/browser-fixture.mjs verify C:\ruta\supabase.exe
# Volver al complejo original antes de limpiar.
node --env-file=.env.local tests/database/browser-fixture.mjs cleanup C:\ruta\supabase.exe
```

Resultado observado con sesión real en el navegador integrado:

- Creación por formulario → «Reserva registrada», pendiente de seña, total ARS 30.000, seña ARS 9.000 y vencimiento del servidor.
- Segunda solicitud abierta antes de crear la primera → rechazo «El turno acaba de ocuparse», conservando los datos ingresados.
- Recarga de la primera URL → misma reserva y mismo vencimiento; no apareció un formulario nuevo.
- Disponibilidad → turno de 18:00 ocupado y turno contiguo de 19:00 disponible.
- Consulta SQL posterior → exactamente una reserva, una ocupación activa y un evento de creación.

Se restauró Soccer-v1 en el navegador antes de limpiar. La limpieza terminó con salida 0 y comprobó que el complejo ficticio ya no existía; se eliminaron su membresía, cancha, horarios, reserva, ocupación y evento. No se ocuparon canchas de Soccer-v1, no se enviaron emails y no se procesaron cobros. Esta prueba cubre solicitudes secuenciales y recuperación por recarga; no simula pérdida de respuesta de red ni repite la contención concurrente ya verificada por SQL. Las carreras de pagos, agenda, bloqueos administrativos y políticas aún no aprobadas permanecen fuera del incremento. Siguiente incremento ejecutable: agenda diaria F07 sobre disponibilidad y reservas existentes.
