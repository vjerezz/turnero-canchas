# F06 — Motor de reservas pendientes

## Reglas confirmadas el 29 de octubre de 2026

Equipo y jugadores esperan una seña del 30% durante 15 minutos. Precio y seña se guardan en centavos de ARS, con redondeo al centavo más cercano (mitad hacia arriba). El reloj de PostgreSQL define la creación y el vencimiento. El precio histórico no cambia cuando se edita la cancha. Los pagos tardíos requieren revisión del propietario, sin confirmar automáticamente ni recuperar un turno ocupado por otra persona.

## Incremento implementado

Migración `202610290003_pending_reservations.sql`, pendiente de aplicar al Supabase remoto:

- `court_occupancies` reúne intervalos de reservas y futuros bloqueos. Una exclusión GiST con `btree_gist` prohíbe superposición activa en la misma cancha, con extremos `[inicio, fin)`. No depende de una consulta previa del navegador.
- `reservations` conserva cliente, fecha de apertura, precio, duración, seña, plazo, operador y clave de idempotencia. Estados previstos: `pending_deposit`, `confirmed`, `expired`. Solo se implementan creación pendiente y vencimiento; no existe una operación de confirmación expuesta al navegador.
- `reservation_events` registra creación y vencimiento sin permisos de modificación para el equipo. Las tres tablas tienen RLS y lectura limitada a miembros vigentes del complejo; no admiten escrituras directas desde clientes.
- `create_team_reservation` verifica membresía, cancha activa, horario semanal/excepción, grilla por duración, conflictos entre jornadas y anticipación inclusiva de 2 horas a 720 horas. Convierte la fecha y los minutos de servicio usando `America/Argentina/Buenos_Aires`.
- Una clave por complejo permite reintentar exactamente la misma solicitud sin duplicar ni extender su espera. Reutilizarla con otro contenido u operador falla. Se serializan la clave y la cancha. Horarios semanales, cambios de cancha y excepciones comparten el bloqueo de cancha con la creación.
- Al intentar crear o recuperar una reserva se vencen y liberan las pendientes de esa cancha cuyo plazo terminó, dentro de la misma transacción. El reintento de una reserva vencida devuelve esa reserva, no genera otra.

El vencimiento persistido es **por demanda**, no un proceso periódico. Una lectura directa de tablas puede mostrar una pendiente cuyo plazo ya terminó; la futura disponibilidad deberá descontarla según `expires_at` y el reloj del servidor. Una creación válida libera primero esos intervalos. Si la operación completa falla, sus cambios se revierten juntos. No presentar la consulta actual de turnos por fecha como disponibilidad de reservas.

## Verificación y límites

Pruebas con PostgreSQL embebido PGlite y extensión real `btree_gist`: precio/seña/plazo, reintento y cambio de contenido, aislamiento, escrituras prohibidas, exclusión entre reservas y bloqueos, extremos contiguos, expiración y auditoría, madrugada por jornada, ventana de anticipación, redondeo y duración de pádel. No equivalen a una prueba concurrente entre conexiones independientes ni a Supabase Auth/PostgREST de extremo a extremo.

Pendientes: aplicar y verificar la migración remota; regenerar tipos desde Supabase; conectar formulario y agenda del equipo; disponibilidad que considere reservas/bloqueos y vencimientos; prueba concurrente entre conexiones; flujo invitado y enlace privado; integración de Mercado Pago, confirmación idempotente e incidencias de pago tardío. Los precios cuya seña redondea a cero permanecen pendientes: no se inventó una exención automática de pago. Cancelación, reprogramación, devoluciones y registro manual de cobros aún requieren reglas explícitas.
