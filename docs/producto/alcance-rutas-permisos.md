# MVP — Alcance, rutas y permisos

Fecha: 24 de octubre de 2026. Deriva del [registro F00](f00-decisiones.md). D02–D04 confirmadas por Valen. Las operaciones señaladas como condicionales esperan D05–D10.

## Alcance de la primera versión

Catálogo de complejos publicados, enlace propio, disponibilidad, reserva invitada, consulta privada y seña en la cuenta del complejo. Administración de equipo, clientes, canchas, horarios, tarifas, agenda y cobros. Alta asistida durante el piloto. Español argentino, ARS, zona operativa Buenos Aires y diseño responsive aprobado.

No incluye mapa/distancias, registro obligatorio del jugador, perfil social, cuenta global de historial comercial, reportes avanzados, mensajes masivos, autoservicio de alta de complejos ni administración global de soporte. El email de acceso privado sí es una dependencia del MVP; no equivale a habilitar marketing o WhatsApp.

## Actores y alcance

- Visitante: ve únicamente publicación y disponibilidad; puede iniciar reserva como invitado.
- Invitado con acceso verificado: consulta una reserva autorizada por un enlace privado. El email escrito en un formulario no demuestra identidad.
- Administrador: identidad autenticada y membresía activa de un complejo; opera agenda, clientes y configuración operativa.
- Propietario: además de operar, administra miembros y vinculación de cobro. No obtiene acceso a otros complejos.
- Sistema: procesa eventos/transiciones permitidas, con operación y alcance definidos. No es un usuario de soporte con acceso general.

Una persona puede ser propietaria en A y administradora en B; los permisos se evalúan para cada operación y complejo. Una reserva invitada no crea membresía ni cuenta Auth.

## Rutas previstas

No se crearon rutas de aplicación en F00. Los IDs no conceden acceso.

| Ruta | Actor | Resultado y límite |
| --- | --- | --- |
| `/` | Público | Catálogo publicado; filtros básicos de deporte, fecha y horario. Sin ubicación precisa ni ranking por distancia |
| `/complejos/[slug]` | Público | Perfil publicado, canchas y disponibilidad del complejo |
| `/complejos/[slug]/reservar` | Invitado | Selección, cotización, nombre/email y condiciones. Crear no implica pago confirmado |
| `/reservas/[id]` | Invitado con acceso validado | Detalle propio y pago según política; sin credenciales válidas ofrecer recuperación, nunca revelar datos |
| `/mis-reservas` | Público como entrada de recuperación | Solicitar enlace por email; respuesta genérica. No lista reservas usando solo email ingresado |
| `/acceso-reserva` | Portador de enlace privado | Canjear credencial y redirigir a detalle autorizado; sin información privada antes de validación |
| `/admin/ingresar` | Equipo | Login del equipo; método técnico inicial propuesto email/contraseña y recuperación |
| `/admin/recuperar-acceso` | Equipo | Recuperación con respuesta genérica, sin filtrar existencia de cuentas |
| `/admin/seleccionar-complejo` | Equipo con membresías | Elegir contexto entre membresías vigentes |
| `/admin` | Equipo | Resumen operativo del complejo activo |
| `/admin/calendario` | Equipo | Agenda diaria, detalle, alta y acciones permitidas |
| `/admin/canchas` y `/admin/canchas/[id]` | Equipo | Alta/edición/desactivación, horarios y tarifas |
| `/admin/clientes` y `/admin/clientes/[id]` | Equipo | Ficha comercial e historial del complejo activo |
| `/admin/equipo` | Propietario | Invitar/revocar administradores; no elevarse a propietario desde una invitación |
| `/admin/invitaciones/aceptar` | Destinatario autenticado | Aceptación de invitación válida, ligada a complejo y email |
| `/admin/configuracion` | Equipo / propietario por acción | Configuración operativa para equipo; publicación/identidad del complejo y MP para propietario |

Endpoints previstos en servidor: creación/cotización de reserva, solicitud/canje de acceso privado, inicio/callback OAuth y webhook de MP. No necesitan una API pública genérica de CRUD. La estructura exacta de Route Handlers/Server Actions se define al implementar, manteniendo los contratos de permisos.

## Matriz de permisos

«Propia» exige acceso privado validado. «Complejo» exige sesión y membresía activa. «Cond.» significa que además falta una política aprobada, no que la acción ya esté habilitada.

| Operación | Público | Invitado verificado | Administrador | Propietario | Sistema |
| --- | --- | --- | --- | --- | --- |
| Consultar catálogo/disponibilidad | Sí | Sí | Sí | Sí | — |
| Crear reserva invitada | Sí, servidor valida | Sí | Como invitado fuera del panel | Como invitado fuera del panel | — |
| Consultar reserva privada | No | Propia | Complejo | Complejo | Solo tarea acotada |
| Consultar/editar clientes | No | No | Complejo | Complejo | Solo captura necesaria |
| Crear reserva administrativa | No | No | Complejo, Cond. D07 | Complejo, Cond. D07 | — |
| Configurar canchas/horarios/tarifas | No | No | Complejo | Complejo | — |
| Publicar complejo/cambiar identidad pública | No | No | No | Complejo | — |
| Bloquear/desbloquear cancha | No | No | Complejo, sin sobrescribir reservas | Igual | — |
| Cancelar/reprogramar | No | No en propuesta inicial | Cond. D09 | Cond. D09 | Solo transición aprobada |
| Crear intento de seña | No sin contexto de reserva | Propia, Cond. D08 | No por suplantación del invitado | Igual | Servidor calcula |
| Registrar cobro manual | No | No | Cond. D10 | Cond. D10 | — |
| Corregir cobro/devolver dinero | No | No | Pendiente D09/D10 | Cond. D09/D10 | Solo operación autorizada |
| Invitar/revocar administradores | No | No | No | Complejo | Entrega de invitación |
| Cambiar propietario / eliminar complejo | No | No | No | Fuera del MVP automático | Procedimiento futuro explícito |
| Conectar/desconectar MP | No | No | No | Complejo | Procesar callback validado |
| Leer tokens MP | No | No | No | No en interfaz | Solo proceso servidor necesario |
| Marcar pago aprobado | No | No | No manualmente como MP | No manualmente como MP | Proveedor verificado |
| Vencer reserva / liberar horario | No | No | No desde reloj cliente | Igual | Cond. D08 |

Los permisos operativos de administración detallados aquí son la especificación técnica derivada del rol; cancelaciones/cobros siguen pendientes. Toda operación no enumerada se deniega hasta definirla. No permitir borrado de historial por desactivar cancha o cliente.

## Alta asistida e invitaciones

1. Responsable del piloto identifica complejo y email del propietario. Preparar alta dirigida; no habilitar un endpoint público de bootstrap.
2. En F04 implementar procedimiento interno ejecutable y auditado que crea complejo y membresía inicial de manera atómica. Su acceso privilegiado se limita al alta indicada y no crea un rol de soporte dentro del producto.
3. Propietario verifica identidad/acceso y completa configuración. El procedimiento no establece contraseñas compartidas.
4. Solo propietario invita administradores. Invitación ligada a complejo, email y rol administrador; credencial aleatoria de un uso, vencimiento técnico y revocación.
5. Aceptar exige identidad del destinatario; reintentos no duplican membresía. Administrador no puede invitar, ascenderse ni conectar MP mediante petición directa.
6. No dejar un complejo sin propietario por una operación común. Transferencia o recuperación de propiedad requiere procedimiento específico antes de habilitarla.

## Acceso de invitados sin cuenta

Nombre y email se piden al crear la reserva. No se utiliza el email por sí solo para recuperar datos ni se fusionan fichas comerciales de distintos complejos. No usar el nombre/email recibido del proveedor para reasignar la reserva automáticamente.

Propuesta técnica para implementar en F08:

- Emitir credencial opaca aleatoria con entropía suficiente, guardar solo hash, asociar a reserva y permiso de consulta. No utilizar un ID predecible como secreto.
- Enviar enlace privado por email. La sesión de creación puede conservar acceso temporal a esa reserva mediante cookie segura; conocer el ID o una URL de retorno de MP no alcanza.
- Canjear el enlace mediante acción explícita, evitando que un escáner de correo consuma el acceso con un GET. Después emitir sesión `HttpOnly`, `Secure`, `SameSite` apropiada y redirigir a URL limpia. Proteger mutaciones contra CSRF.
- Vencimiento técnico, revocación y regeneración del enlace se definirán en F08; no confundirlos con vencimiento comercial de la reserva.
- Sin analytics de terceros en canje; redacción de tokens en logs y `Referrer-Policy: no-referrer`. Credenciales fuera de URLs posteriores y de cachés compartidas.
- Recuperación por email con respuesta genérica, límites por origen/destino y envío a la dirección guardada. Enlace acotado a reserva, sin otorgar acceso global al historial de todos los complejos.
- Errores de entrega se reintentan de forma idempotente; el estado de envío no cambia confirmación/pago. Email transaccional, dominio y proveedor deben estar operativos antes del piloto público.
- Cambiar email requiere un mecanismo de verificación definido; no se ofrece edición libre conociendo datos de la reserva.

La creación anónima exige protección de abuso para no bloquear canchas masivamente: rate limiting, límites de pendientes y mecanismo de verificación adicional ante abuso. Los límites y si la verificación del email debe preceder a la ocupación dependen de D07/D08 y se resuelven antes de F06/F08; no introducir ese comportamiento en silencio.

## Recorridos de aceptación

| ID | Recorrido | Resultado observable |
| --- | --- | --- |
| U01 | Visitante filtra catálogo y abre complejo | Solo complejos publicados; filtros coherentes; contexto visible |
| U02 | Invitado selecciona cancha/fecha/horario y envía nombre/email | Reserva creada una vez con cotización de servidor y estado aprobado por D07 |
| U03 | Invitado abre enlace privado | Puede consultar su reserva sin cuenta; no accede a otra cambiando ID |
| U04 | Invitado pierde enlace y solicita recuperación | Respuesta genérica y entrega privada; no enumeración de emails |
| U05 | Dos invitados intentan mismo intervalo | Una ocupación; el otro recibe conflicto recuperable |
| U06 | Propietario completa alta asistida e invita administrador | Miembros del complejo correcto; invitación no reutilizable |
| U07 | Administrador cambia de complejo A a B | Solo membresías autorizadas; sin datos cacheados de A en B |
| U08 | Administrador opera agenda | Cliente y cancha del mismo complejo; cambios condicionales respetan políticas |
| U09 | Propietario conecta MP y llega pago | Receptor correcto; webhook verificado; retorno no confirma por sí solo |
| U10 | Invitado intenta `/admin` o ID ajeno | Denegación sin datos privados |

Piloto: al menos dos complejos con propietarios distintos, un administrador y un usuario de equipo con dos membresías; invitados con y sin acceso privado; cuentas de cobro separadas. No abrir al público hasta pasar permisos, concurrencia, entrega de email y prueba de cobro.
