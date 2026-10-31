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

## Excepciones por jornada — 29 de octubre

Implementadas ruta /admin/canchas/[id]/excepciones, formulario de cierre o franja especial y listado persistido. La excepción se identifica por cancha y fecha de apertura; reemplaza toda esa jornada, incluida su continuación al día siguiente, y conserva la madrugada procedente de la jornada anterior. La resolución hoursForServiceDate usa esta prioridad sobre el horario semanal. No crea disponibilidad ni cancela reservas.

Migración 202610290001_date_exceptions aplicada por SQL Editor a Supabase y registrada en su historial dentro de la misma transacción. RLS limita lecturas y escrituras a miembros vigentes; clave compuesta impide asociar una cancha ajena al complejo propio; no se conceden DELETE ni cambios de cancha, complejo o fecha. El servidor valida sesión, cancha y datos antes de escribir. Actualizaciones simultáneas de una misma excepción usan la última escritura; un alta concurrente duplicada devuelve error recuperable.

Verificación: 112 pruebas unitarias y 16 escenarios PostgreSQL embebidos aprobados, TypeScript sin errores. La pantalla autenticada de Soccer-v1 cargó el estado vacío y los campos de horario especial, revisada visualmente a 600 px. No se cargaron cierres reales sin fechas indicadas por el usuario; guardado completo por navegador y matriz responsive siguen pendientes. Falta restaurar el horario semanal eliminando una excepción, validar conflictos entre jornadas especiales y adyacentes al integrar disponibilidad y regenerar tipos desde Supabase. El contrato local de datos sigue identificado como manual.

## Restauración y cierre real — 29 de octubre

Se agregó la opción Volver al horario semanal con confirmación por fecha. Desactiva la excepción conservando sus valores; guardar nuevamente esa fecha la reactiva. La migración 202610290002_restore_weekly_hours fue aplicada y registrada en Supabase. La acción exige membresía vigente y limita la actualización por complejo, cancha y fecha; no se habilita DELETE.

Valen pidió cerrar Cancha 1 el 30/10/2026 desde las 18:00. Se guardó el cierre de esa jornada, que abarca hasta el 31/10 a las 02:00 según su semana vigente. Se verificó en navegador el alta, la restauración temporal del horario semanal y la reactivación del cierre solicitado. El estado final debe conservar Jornada cerrada el 30/10. La madrugada del 30/10 procedente del jueves se conserva. El motor de reservas aún está pendiente.

Verificación local: 113 pruebas unitarias, 17 escenarios SQL y TypeScript aprobados. Las pruebas incluyen desactivar/reactivar sin perder la excepción y denegar actualizaciones desde otro complejo.

## Consulta de turnos por jornada — 29 de octubre

Nueva ruta /admin/canchas/[id]/turnos, enlazada desde Canchas. Permite seleccionar fecha de apertura y combina horario semanal con excepción activa; las excepciones desactivadas recuperan el horario semanal. Muestra turnos completos, madrugada siguiente, cancha inactiva y límites de anticipación de 2 horas/30 días según reloj del servidor. Las consultas siempre se limitan por complejo y cancha autenticados.

La conversión de minutos locales a instantes usa Intl con America/Argentina/Buenos_Aires, sin depender de la zona del host. Se consultan también las excepciones de las jornadas vecinas para advertir superposiciones; esta advertencia no reemplaza una restricción transaccional al crear reservas. La pantalla indica que todavía no consulta reservas ni bloqueos y no presenta los turnos como disponibles.

Verificación: 124 pruebas unitarias y TypeScript aprobados. Navegador real: el 30/10 aparece cerrado; el 29/10 conserva ocho turnos hasta el 30/10 a las 02:00. Se probó selección de fecha y envío por teclado, y se revisó la pantalla a 390, 768 y 1280 px. Sin migración nueva en este incremento. Pendientes F06: ocupación transaccional, estados, creación y confirmación por seña; reglas comerciales confirmadas y faltantes en f00-decisiones.md.
