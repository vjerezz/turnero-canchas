# F05 — Canchas y precio fijo

28 de octubre de 2026. Implementado y con las tres migraciones aplicadas en Supabase de desarrollo mediante SQL Editor.

Verificación: 14 escenarios SQL embebidos y 65 pruebas unitarias aprobados; lint y TypeScript sin errores. Se abrió el formulario de nueva cancha en el navegador integrado con la sesión propietaria de Soccer-v1 y se inspeccionaron campos y botón, con desplazamiento vertical. No se guardaron canchas reales; falta verificar creación/edición/desactivación de extremo a extremo, además de la matriz completa de tamaños y teclado.

Rutas: `/admin/canchas`, `/admin/canchas/nueva` y `/admin/canchas/[id]`. Propietarios y administradores vigentes pueden crear, editar y desactivar canchas del complejo elegido. Los formularios permiten nombre, fútbol 5/6 o pádel y precio por turno completo en ARS. La duración se calcula en PostgreSQL (60/90 minutos); no se acepta del navegador. Desactivar conserva la fila; no se concede DELETE ni modificación de `complex_id`, moneda o duración.

Migraciones aplicadas y registradas en el historial remoto el 28 de octubre:

1. `supabase/migrations/202610270001_invitation_rate_limit.sql`.
2. `supabase/migrations/202610280001_courts.sql`.
3. `supabase/migrations/202610280002_weekly_hours.sql`.

Se ejecutaron juntas en una transacción desde la sesión autenticada del operador. Se verificaron las tablas, las funciones y RLS habilitado en ambas tablas. Se registraron versión y nombre en supabase_migrations.schema_migrations; statements quedó sin contenido. El cliente normal usa la clave pública y RLS. Al recargar /admin/canchas con la sesión propietaria, Soccer-v1 mostró el estado vacío correcto y el botón Agregar cancha, sin el error de carga.

`src/lib/supabase/app-database.ts` es un contrato local explícitamente escrito a mano para la migración nueva. El archivo generado `database.types.ts` conserva su procedencia original. Pendiente: regenerar tipos desde Supabase y sustituir el contrato complementario.

La política RLS valida membresía vigente en lecturas, altas y modificaciones; cada acción de servidor también limita el ID de cancha al complejo autorizado. Se probaron aislamiento A/B, escrituras cruzadas, duración calculada, valores inválidos, desactivación, privilegios por columna y revocación de membresía en PostgreSQL embebido. Esto no sustituye la prueba HTTP sobre Supabase.

## Horarios semanales — 28 de octubre

Verificación de este incremento: 79 pruebas unitarias y 15 escenarios SQL embebidos aprobados; lint y TypeScript sin errores. En el navegador autenticado de Soccer-v1, el listado de canchas devolvió el mensaje de fallo de carga. No se pudo revisar visualmente el formulario de horarios ni guardar horarios reales; esa observación fue previa a la aplicación remota; el listado ya funciona, pero el formulario y guardado real siguen pendientes. Las pruebas SQL verifican el control de versión secuencial y rollback; queda pendiente ensayo con conexiones independientes.

Valen confirmó que las canchas pueden cerrar después de medianoche. Se agregó `/admin/canchas/[id]/horarios`, con una franja por día de apertura, días cerrados y cierre explícito al día siguiente. Las horas recurrentes se guardan como minutos de hora local de Buenos Aires; no se convierten todavía en fechas UTC. La vista de turnos muestra únicamente turnos completos de 60/90 minutos desde la apertura y avisa si queda un remanente insuficiente. No representa disponibilidad real.

El guardado reemplaza la semana en una sola transacción, con control de versión para evitar sobrescribir una edición concurrente. La función comprueba membresía y cancha del complejo, bloquea la fila de cancha y rechaza superposiciones, incluyendo domingo/lunes. Las tablas no permiten escrituras directas desde la API; solo lectura aislada por RLS y escritura por la función autorizada. Los errores revierten horarios y versión. Un día cerrado no recorta la franja iniciada la noche anterior. La edición semanal no altera otros datos de la cancha.

Pendientes de F05: verificación completa de escritura de canchas y horarios en navegador, varias franjas por día si se requieren, excepciones por fecha, anticipación, horizonte y ficha de clientes. No existe todavía disponibilidad ni motor de reservas. Al incorporar reservas en F06 se deberán conservar precios y condiciones históricos, definir el efecto de editar o desactivar una cancha con reservas existentes y convertir cada fecha local a instantes UTC en `America/Argentina/Buenos_Aires`.

## Primera cancha real — 28 de octubre

Por indicación de Valen se creó Cancha 1 en Soccer-v1: fútbol 5, 60 minutos y ARS 30.000 por turno. Se guardó la semana completa, lunes a domingo de 18:00 a 02:00 del día siguiente, desde el navegador autenticado usando los formularios y acciones de servidor. El listado mostró la cancha activa y el precio correcto; la página de horarios confirmó el guardado y devolvió las siete franjas persistidas, con ocho turnos completos por jornada, incluido 01:00–02:00 del día siguiente. No se crearon reservas ni se enviaron correos.

La revisión visual se realizó en el tamaño actual del navegador integrado (600 px); siguen pendientes la matriz de 390/768/1280, teclado completo y edición/desactivación real. El alta y el primer guardado de horarios ya quedaron verificados sobre Supabase, sustituyendo los pendientes históricos de esas dos operaciones.

Se agregaron 13 pruebas de la acción de horarios: contexto autorizado frente a un complejo adulterado, sesión rechazada, campos inválidos, cierre nocturno, cruce domingo/lunes, semana cerrada y errores de versión/permisos sin filtrar detalles internos. Resultado: 92 pruebas unitarias aprobadas y TypeScript sin errores. Estas pruebas simulan el cliente Supabase y no representan concurrencia entre conexiones.
