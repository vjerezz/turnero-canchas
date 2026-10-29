# F00 — Contrato del MVP y registro de decisiones

Fecha: 24 de octubre de 2026. Responsable de producto: Valen. Responsable técnico de esta preparación: Codex. Estado general: documentación preparada; prueba externa de Mercado Pago pendiente y reglas comerciales abiertas.

## Resultado de esta ejecución

Actualización D05 del 28 de octubre: Valen confirmó horarios que cruzan medianoche (ejemplo 18:00–02:00 del día siguiente). Se implementó configuración semanal con cierre al día siguiente y turnos consecutivos; anticipación, horizonte y excepciones siguen pendientes. Esta confirmación sustituye las referencias anteriores a operación nocturna pendiente de decisión.

D06 confirmada el 28 de octubre: precio fijo por turno completo y por cancha, en ARS. No se adoptan tarifas por hora ni franjas para este incremento. `src/features/courts/court-schema.ts` valida importes decimales y los convierte a centavos enteros. Estas validaciones aún no están conectadas a formularios ni persistencia de canchas; la cotización histórica de reservas se concretará en F06.

Actualización del 28 de octubre de 2026 — D05 parcialmente confirmada por Valen: fútbol 5 y fútbol 6 duran 60 minutos; pádel dura 90 minutos; los turnos son consecutivos, sin pausas. La generación comienza en la apertura de la franja y solo ofrece turnos completos que entren antes del cierre. `src/features/courts/schedule.ts` implementa esta base sobre instantes ya resueltos. Siguen pendientes anticipación, horizonte y reglas de operación nocturna; la conversión de horarios locales y la persistencia de canchas aún no están implementadas. D06 quedó confirmada en la actualización anterior: precio fijo por turno y cancha.

| Tarea | Estado | Evidencia / salida pendiente |
| --- | --- | --- |
| F00.1 | Registro preparado; D01–D04 resueltas | Decisión técnica D01 y respuestas explícitas de Valen para D02–D04 |
| F00.2 | Contrato documental definido | [Alcance, rutas y permisos](alcance-rutas-permisos.md), con operaciones condicionales identificadas |
| F00.3 | Revisión documental realizada; prueba real pendiente | [Validación de Mercado Pago](../architecture/mercado-pago-validacion.md); Valen confirmó que aplicación y cuentas de prueba aún no están preparadas |
| F00.4 | Contrato propuesto preparado | [Reservas, tarifas y pagos](reservas-tarifas-pagos.md); D05–D10 requieren definición antes de su implementación |

No marcar F00 como completamente terminada: falta ejecutar OAuth/cobro por vendedor con cuentas de prueba. Esto no impide F01/F02. Las reglas comerciales pendientes tampoco impiden componentes ni pantallas con fixtures expresamente identificados.

## Decisiones confirmadas en esta conversación

- Catálogo básico de complejos y enlace propio para cada uno.
- Alta asistida del complejo para el piloto, propietario inicial e invitaciones de administradores.
- Solo el propietario gestiona el equipo y conecta Mercado Pago.
- El jugador reserva como invitado: no requiere cuenta ni contraseña.
- Datos del invitado: nombre y email; consulta posterior mediante enlace privado enviado por email.
- La aplicación de Mercado Pago y sus cuentas de prueba todavía no están preparadas.

Estas decisiones reemplazan las propuestas anteriores de cuenta obligatoria y área de jugador basada necesariamente en login. No autorizan cancelaciones, devoluciones ni cambios de precio por parte del invitado.

## Registro D01–D14

«Confirmada» indica decisión de Valen o instrucción permanente. «Elegida técnica» indica decisión de ingeniería tomada para ejecutar F00, no una aprobación comercial atribuida al usuario. «Propuesta» no habilita implementación de reglas de negocio.

| ID | Estado y responsable | Resolución / propuesta concreta | Límite y tarea afectada |
| --- | --- | --- | --- |
| D01 | Elegida técnica · Codex | Supabase tipado + SQL versionado + funciones transaccionales; sin Drizzle/Prisma. pnpm como único gestor. Ver [ADR-001](../architecture/adr-001-datos-migraciones.md) | Resuelta para F01/F04; implementación y versiones aún no existen |
| D02 | Confirmada · Valen | Catálogo básico en `/` y detalle/enlace por complejo. Sin mapa, ranking por distancia ni geolocalización | Resuelta para F03/F08 |
| D03 | Confirmada · Valen | Alta asistida, propietario inicial, invitaciones de administradores; equipo y conexión MP solo propietario | Resuelta como alcance F04; implementar bootstrap seguro, no admin global |
| D04 | Confirmada · Valen | Invitado con nombre/email, sin cuenta, acceso por enlace privado. Cuenta de equipo separada | Resuelta para flujo jugador; diseño de acceso privado en contrato de alcance |
| D05 | Propuesta · Valen decide; Codex implementa | Duración única configurable por cancha; grilla de inicios alineada con duración; anticipación/horizonte explícitos y servicio nocturno permitido mediante fin al día siguiente | Resolver duración, paso, anticipación y horizonte antes de F05.3/F06.3; no usar 60/90 minutos como valor implícito |
| D06 | Propuesta · Valen decide | Precio por turno completo en ARS, base por cancha y excepciones por franja/vigencia con prioridad inequívoca; conservar cotización histórica | Resolver tarifas, precedencia y redondeo antes de F05.4/F06.4 |
| D07 | Propuesta · Valen decide | Reserva pendiente de seña ocupa intervalo; pago verificado suficiente confirma; creación administrativa confirma solo según permiso/regla definida | Resolver estados y ocupación antes de F06.1/F06.2 |
| D08 | Propuesta · Valen decide | Seña configurable por complejo; elegir fija o porcentaje; definir vencimiento y política de pago tardío de manera explícita | Resolver modalidad, valores y plazo antes de F06/F09; no liberar automáticamente por ejemplo de maqueta |
| D09 | Propuesta · Valen decide | Invitado consulta; cancelación/reprogramación administradas por equipo en MVP, con reglas y devolución separadas. Sin autoservicio de cancelación inicial | Resolver quién puede, plazo, costo, devolución y ausencia antes de F06.5/F09.6 |
| D10 | Propuesta · Valen decide | Cobro manual de seña/saldo con medio, importe, fecha y operador; corrección compensatoria auditada, nunca borrar pago | Resolver medios y permisos antes de F07/F09.6 |
| D11 | Parcialmente confirmada · Valen / Codex | Confirmado email transaccional con enlace privado al invitado. Proveedor, dominio y entrega por validar; otras notificaciones siguen fuera del MVP | Email de acceso pasa a F08; no puede esperar a F10. Invitaciones de equipo requieren entrega en F04 |
| D12 | Propuesta · Valen decide | Primer panel: reservas del día, próximos turnos y pendientes; no publicar porcentaje de ocupación o ingresos hasta fijar fórmulas | Resolver métricas antes de F10.1; no bloquea agenda |
| D13 | Pendiente · Valen | Suscripción de Turnero separada; definir precio, forma de cobro y modalidad comercial del piloto. Sin comisión de plataforma agregada a señas por inferencia | Antes de piloto comercial; automatización F12 |
| D14 | Parcialmente confirmada · Valen | Nombre/email del invitado confirmados; no pedir DNI, teléfono ni cuenta por defecto. Retención, términos y tratamiento de datos aún pendientes | Minimización para F04/F08; textos y retención antes de salida pública |

## Preguntas comerciales para el siguiente cierre

No es necesario resolverlas para inicializar estilos y componentes. Sí deben quedar contestadas antes de implementar persistencia de reglas y motor de reservas.

1. D05: ¿qué duraciones se pueden configurar, cada cuánto empieza un turno, con cuánta anticipación y hasta cuántos días puede reservarse?
2. D06: ¿precio por turno completo, hora o franja? ¿Una reserva que atraviesa dos tarifas cómo se cobra? ¿Qué prioridad tienen excepciones?
3. D07/D08: ¿cuándo queda confirmada, cuánto se paga de seña, cuánto se mantiene el horario pendiente y qué ocurre con el pago tardío?
4. D09: ¿quién cancela/reprograma, hasta cuándo, con qué costo y qué pasa con la seña? ¿Cómo se trata una ausencia?
5. D10: ¿se registran efectivo/transferencia y saldo presencial? ¿El administrador puede hacerlo y corregirlo o requiere propietario?

Cada respuesta debe registrarse aquí y reflejarse en el contrato de transiciones antes de escribir automatizaciones.

## Próxima ejecución habilitada

F01: inicializar aplicación, fijar versiones compatibles, pnpm/lockfile, estilos y comandos reales. F02: componentes y layout. No inicializar tablas de reservas ni integración de pagos bajo políticas supuestas. No crear aún un portal de cuentas de jugadores: la reserva invitada es el recorrido confirmado.

Para cerrar F00.3 se necesita preparar la aplicación de Mercado Pago, vendedores/comprador de prueba y un callback HTTPS. Las credenciales deben configurarse localmente en un almacén seguro o variables excluidas del repositorio; nunca en estos documentos ni en el chat. No se ha solicitado ni ejecutado un cobro real.
