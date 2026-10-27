# Contrato propuesto — Reservas, tarifas y pagos

Fecha: 24 de octubre de 2026. Estado: borrador de F00.4. D05–D10 pendientes de decisión de Valen. Este documento prepara el contrato; no aprueba valores, plazos ni automatizaciones.

## Invariantes confirmados

- Toda reserva, ocupación, cliente, cancha y operación de pago tiene alcance inequívoco de complejo.
- Reserva y bloqueo activos no se superponen para la misma cancha, incluso concurrentemente; intervalos `[inicio, fin)` con inicio menor a fin.
- Instantes UTC; reglas recurrentes y fecha de servicio locales en `America/Argentina/Buenos_Aires`.
- Precio y moneda se calculan en servidor, con unidades menores enteras y snapshot de condiciones.
- El reloj del servidor determina transiciones. Un horario seleccionado aún no concede exclusividad.
- Reserva, pago, bloqueo y tiempo derivado son dimensiones diferentes.
- El invitado crea sin cuenta y accede mediante mecanismo privado; el equipo actúa mediante membresía y rol.

## Datos que debe contener una cotización

Complejo y cancha publicados/habilitados, fecha local, inicio y fin UTC, duración, moneda ARS, total en centavos, seña y saldo cuando estén definidos, versión de tarifa y política aplicadas. La cotización no bloquea disponibilidad. Al confirmar se valida de nuevo; si precio o condiciones cambian, se pide aceptar el nuevo resumen antes de cobrar.

No confiar en `total`, `complex_id`, rol o vencimiento enviados por cliente. No redondear usando floats. Si se elige porcentaje, definir precisión del porcentaje y regla de redondeo; el saldo debe satisfacer `total = seña + saldo`.

## Configuración propuesta y decisiones faltantes

| Tema | Propuesta para evaluar | Falta decidir |
| --- | --- | --- |
| Duración | Una duración por cancha en MVP | Valores permitidos, paso entre inicios y posibles pausas |
| Horarios | Semanales locales + excepción por fecha | Anticipación, horizonte y horario nocturno |
| Nocturno | Fecha de servicio y fin al día siguiente explícitos | Si se habilita y cómo se presenta al reservar |
| Tarifa | Precio por turno completo | Precio base, franjas y cruces de franjas |
| Precedencia | Excepción por fecha sobre regla semanal/base, sin empates | Confirmar prioridad y vigencia |
| Seña | Fija o porcentual por complejo | Modalidad, valor y redondeo; total mínimo/máximo |
| Pendiente | Ocupa mientras se intenta cobrar | Si existe, plazo y límite de reservas anónimas pendientes |
| Cancelación | Gestionada inicialmente por equipo | Plazos, costo, devolución y permiso |
| Reprogramación | Cambio atómico sin perder original si falla | Reprecio y tratamiento de seña ya pagada |
| Cobro manual | Registro separado del proveedor | Medios, permisos y correcciones |

## Estados candidatos — no enums definitivos

| Dimensión | Estados propuestos | Disponibilidad |
| --- | --- | --- |
| Reserva | Pendiente de confirmación, confirmada, cancelada, vencida | Pendiente y confirmada ocuparían; cancelada/vencida no. Requiere D07/D08 |
| Pago/intento | Creado, pendiente, aprobado, rechazado, cancelado, devolución pendiente, devuelto, disputa | No determina por sí solo la ocupación |
| Bloqueo | Activo, retirado | Activo ocupa |
| Tiempo derivado | Próxima, en juego, finalizada | Se calcula del intervalo y estado; no representa cobro |

Una reserva pasada confirmada puede mostrarse «Completada» como presentación temporal; si se requiere asistencia/ausencia como dato, aprobar esa dimensión antes de agregarla. Un pago aprobado no se convierte en rechazado porque llegó tarde un evento antiguo: reconciliar con estado actual y reglas del proveedor.

## Tabla de transiciones a aprobar

| Evento / actor | Precondiciones | Efecto propuesto | Reintento y fallo | Decisión |
| --- | --- | --- | --- | --- |
| Crear invitada / servidor | Complejo publicado, cotización válida, contacto y protección de abuso | Crear pendiente y ocupación atómicamente si se adopta retención | Misma clave/payload devuelve mismo resultado; conflicto no crea reserva | D05–D08 |
| Crear administrativa / equipo | Membresía, cliente/cancha locales y rango libre | Crear estado autorizado y ocupación | No confiar en flag «pagada» del formulario | D07/D10 |
| Bloquear / equipo | Rango libre y motivo interno | Crear bloqueo y ocupación común | Si coincide con reserva, rechazar; no cancelar implícitamente | Invariante confirmada |
| Retirar bloqueo / equipo | Mismo complejo y versión vigente | Desactivar ocupación de bloqueo | Reintento no afecta reservas | Invariante confirmada |
| Aprobar pago / servidor | Firma y consulta proveedor, receptor/moneda/importe correctos | Registrar pago; confirmar si política y ocupación lo permiten | Evento duplicado sin doble efecto | D07/D08 |
| Rechazar pago / servidor | Estado verificado | Registrar rechazo del intento | No liberar automáticamente salvo política explícita | D08 |
| Vencer / sistema | Plazo aprobado, reloj servidor y estado esperado | Pasar a vencida y liberar en una transacción | Carrera con pago se serializa; no reactivar por evento viejo | D08 |
| Cancelar / equipo | Permiso y reglas aprobadas | Cancelar y liberar; devolución se tramita aparte | No afirmar devolución antes de verificarla | D09 |
| Reprogramar / equipo | Nueva cotización y disponibilidad, versión esperada | Mover ocupación y actualizar reserva atómicamente | Con conflicto, mantener original y dinero intactos | D09 |
| Registrar manual / equipo | Medio/importe válidos y permiso | Movimiento financiero auditado | Idempotencia; no simular un pago MP | D10 |
| Devolver / actor autorizado | Pago elegible y monto permitido | Solicitud idempotente y estado de devolución | Confirmación del proveedor separada de solicitud | D09/D10 |

## Carreras y excepciones que deben tener salida

1. **Pago después de vencimiento:** no recuperar una cancha ocupada por otra reserva. Propuesta: incidencia de conciliación visible al propietario y resolución según política de devolución/reasignación aún pendiente. No confirmar dos reservas.
2. **Pago aprobado y cancelación simultánea:** controlar versión/bloqueo transaccional y decidir cuál transición admite la política. Actualizar contabilidad aunque la reserva no pueda confirmarse.
3. **Dos pagos aprobados para una seña:** guardar ambos hechos financieros; una sola confirmación y tratamiento explícito del excedente. No descartar dinero recibido como duplicado de evento.
4. **Timeout al iniciar checkout:** no crear otro cobro ciegamente; consultar intento/reconciliar antes de reintentar. La deduplicación de evento no sustituye idempotencia de solicitud.
5. **Email falla:** reserva y pago conservan su estado real; entrega pendiente/reintento. El invitado debe poder recuperar acceso sin revelar datos a terceros.
6. **Cambio de tarifa/cierre:** no reescribir contratos de reservas existentes ni cancelar turnos al editar un horario.
7. **Reserva anónima abusiva:** antes de habilitar ocupación por invitado, definir límites y verificación de contacto según riesgo; no resolverlo imponiendo una cuenta obligatoria contrariando D04.

## Casos de prueba derivados

Contiguos permitidos; superposición rechazada; bloqueo contra reserva; cancha/cliente de otro complejo; fecha local cerca de medianoche; cotización alterada; tarifa ambigua; reprogramación fallida; misma idempotency key con payload diferente; pago repetido vs evento repetido; pago tardío; cancelación simultánea; devolución parcial si se aprueba; enlace invitado vencido, repetido o para otra reserva.

Estado de verificación: contrato revisable preparado, sin pruebas de aplicación ni base ejecutadas. Antes de F06 reemplazar propuestas por decisiones y completar la tabla con estados definitivos, permisos y efectos financieros.
