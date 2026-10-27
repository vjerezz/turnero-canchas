# Plan de implementación de Turnero Canchas

Fecha: 24 de octubre de 2026. Estado: propuesta ejecutable; no implica aprobación de reglas comerciales pendientes. La tarea realizada es planificación, no inicialización de la aplicación.

Actualización de ejecución, 26 de octubre: F01 implementada y F02 desarrollada; consultar [registro F01](architecture/f01-inicializacion.md) y [registro F02](architecture/f02-interfaz-responsive.md). El diagnóstico siguiente describe la carpeta original al planificar. Próxima entrega de producto: F03, pantallas y estados con datos de demostración.

Actualización posterior: F03 implementada en `/demo`, exclusivamente en desarrollo. Ver [pantallas, adaptación visual y límites](architecture/f03-prototipo.md). Siguiente fase: F04. Los fixtures de F03 no aprueban políticas comerciales ni constituyen servicios reales.

Actualización F00: ver [registro vigente](producto/f00-decisiones.md). D01 elegida técnicamente; D02–D04 confirmadas. Catálogo + enlace por complejo, alta asistida, equipo/MP solo propietario y reserva invitada con nombre/email y enlace privado. Los detalles de cuenta del jugador que figuran como propuestas iniciales más abajo quedan sustituidos por este recorrido. La prueba externa de MP y D05–D10 siguen pendientes.

## 1. Diagnóstico y fuentes

Se revisaron todos los archivos existentes: `AGENTS.md`, `tokens.css`, `docs/design/direccion.md`, el PDF de stack (3 páginas), el PDF de dirección visual (8 páginas) y el HTML de dirección visual, incluidos sus seis tableros embebidos y sus plantillas. Se inspeccionaron visualmente las ocho páginas del PDF de diseño.

| Fuente | Aporte | Cómo se utiliza |
| --- | --- | --- |
| [AGENTS.md](../AGENTS.md) | Alcance confirmado, aislamiento, pagos, fechas, estructura y calidad | Restricciones permanentes |
| [Stack recomendado](Turnero%20Canchas%20%C2%B7%20Stack%20recomendado%20y%20archivos%20base%20para%20Codex.pdf) | Stack y recomendación de fases | Base técnica propuesta, no configuración existente |
| [Dirección de diseño](design/direccion.md) | Identidad aprobada y comportamiento esperado | Criterios visuales y de experiencia |
| [Tokens](../src/styles/tokens.css) | Valores semánticos implementables | Fuente única de estilos |
| [Referencia HTML](design/screens/Turnero%20Canchas%20%E2%80%94%20Direcci%C3%B3n%20visual.html) | Composiciones y medidas originales | Referencia de geometría; no reutilizar su runtime como aplicación |
| [Referencia PDF](design/screens/Turnero%20Canchas%20%E2%80%94%20Direcci%C3%B3n%20visual.pdf) | Apariencia de las composiciones | Inspección visual; sus páginas impresas no equivalen a viewports |

Estado comprobado: no existen `package.json`, lockfile, código de aplicación, pruebas ni README. La carpeta no es un repositorio Git reconocido desde su ubicación actual. No se verificaron cuentas o servicios externos configurados. Los tokens ya existen, aunque el PDF de stack aún habla de crearlos.

La base visual es suficiente para comenzar componentes y prototipos. Todavía no existe una especificación funcional completa. Los mayores riesgos son reservas concurrentes, permisos entre complejos, pago tardío y reglas comerciales sin definir.

### Diferencias que deben resolverse al maquetar

- Las maquetas incluyen cancelación gratuita, vencimientos, liberación automática, recordatorios y comprobantes enviados. Son ejemplos; no habilitan esas funciones.
- El HTML usa tamaños fuera de la escala, radios adicionales, sombras en búsqueda, Bricolage por debajo de 20 px y texto de 11 px. Prevalecen las instrucciones y tokens vigentes; registrar estas desviaciones al comparar capturas.
- La maqueta representa completadas en verde; la dirección vigente y los tokens establecen superficie neutra.
- Las composiciones móviles tienen dimensiones fijas de 390 × 844 y contenido recortado. La implementación debe permitir desplazamiento y contenido completo.
- La búsqueda muestra deportes mezclados pese a indicar un filtro de fútbol 5. Los resultados reales deberán respetar el filtro.
- No hay diseños específicos de tablet, administración móvil, autenticación, configuración, clientes, cobros ni reserva de escritorio.
- Un portal multi-complejo no implica automáticamente un marketplace con geolocalización, distancias, rankings o mapas.

## 2. Alcance y entregas

### Núcleo del MVP

Una aplicación con portal en `/` y administración en `/admin`; múltiples complejos aislados desde el principio; identidad, membresías y roles; gestión de canchas, horarios, tarifas y clientes; disponibilidad; reservas y bloqueos sin superposición; operación diaria; consulta de reservas del jugador; señas en la cuenta de Mercado Pago de cada complejo; interfaz accesible en móvil y escritorio.

La posibilidad de cancelar, reprogramar, vencer una reserva, registrar un cobro manual o devolver dinero se implementará únicamente con reglas explícitas. El plan contempla esas capacidades, pero su comportamiento no queda aprobado por este documento.

### Entregas verificables

1. **Prototipo navegable:** componentes, pantallas y estados con datos de demostración; sin operaciones reales.
2. **Operación interna:** complejos, configuración y reservas administrativas con persistencia y aislamiento comprobados.
3. **Reserva pública y pago de prueba:** recorrido completo con datos reales de prueba y dos complejos.
4. **Piloto de producción:** operación observada y procedimientos de recuperación probados.
5. **Evolución comercial:** capacidades adicionales aprobadas y suscripción del SaaS, con su propio alcance.

Fuera del núcleo hasta una decisión: calendario semanal, arrastrar reservas, turnos recurrentes, lista de espera, promociones, membresías deportivas, torneos, mapas, distancias, favoritos, notificaciones masivas, WhatsApp, reportes avanzados, exportaciones, marca por complejo, tema oscuro, administración global de soporte y automatización de suscripciones. No mostrar botones sin función para simular que existen.

## 3. Arquitectura propuesta

Estas recomendaciones deben convertirse en decisiones de arquitectura antes de implementar la parte correspondiente. D01 ya se resolvió en [ADR-001](architecture/adr-001-datos-migraciones.md): Supabase tipado, migraciones SQL y pnpm; no ORM adicional.

| Área | Propuesta | Motivo / validación pendiente |
| --- | --- | --- |
| Aplicación | Next.js App Router, TypeScript estricto | Una aplicación, layouts separados y lógica protegida en servidor |
| Interfaz | Tailwind y shadcn/ui adaptados a tokens | Componentes semánticos y reutilizables; verificar accesibilidad real |
| Gestor | pnpm y un único lockfile | Instalación reproducible; fijar versiones compatibles en F01 |
| Auth y base | Supabase Auth y PostgreSQL | Identidad y RLS, con autorización adicional por operación |
| Datos y migraciones | Elegido en F00: cliente tipado Supabase, tipos generados, migraciones SQL versionadas y funciones transaccionales para reservas | Mantener RLS y restricciones PostgreSQL explícitas sin dos motores de migración |
| Alternativa de datos | Drizzle descartado para este MVP | Reconsiderar únicamente mediante nuevo ADR ante una necesidad concreta |
| Validación | Zod en límites del servidor | El navegador no determina permisos, montos ni disponibilidad |
| Pagos | Integración por vendedor con OAuth; evaluar Checkout Pro | Confirmar producto, cuentas de prueba y flujo admitido por Mercado Pago en F00/F09 |
| Verificación | Vitest, Playwright e integración PostgreSQL | Lógica, experiencia y garantías reales de datos |
| Entornos | Local, pruebas y producción separados; Vercel como destino propuesto | No usar credenciales o datos de producción en previews |

No se fijan números de versión sin comprobar compatibilidad al inicializar. El README deberá listar los comandos que realmente queden creados.

### Límites de responsabilidad

- `src/app/`: rutas, layouts, carga y composición. Server Components para lectura donde corresponda; componentes de cliente para interacción.
- `src/components/ui/`: base visual accesible, sin reglas de reservas.
- `src/features/`: complejos, equipo, canchas, clientes, disponibilidad, reservas y pagos; crear cada módulo cuando entre en alcance.
- `src/lib/`: autenticación, contexto validado de complejo, base, fechas y proveedores. Módulos sensibles solo de servidor.
- `src/styles/tokens.css`: trasladar el archivo inicial, importar una vez y actualizar enlaces documentales.
- `supabase/migrations/`: ubicación propuesta si se adopta la estrategia SQL. Cambios repetibles desde base vacía; evitar cambios manuales que no queden versionados.

### Modelo conceptual a concretar en F04–F06

| Entidad | Relación y garantía |
| --- | --- |
| Identidad del equipo / acceso invitado | Auth para equipo; invitado con acceso privado por reserva, sin perfil global obligatorio |
| Complejo / publicación pública | Información operativa privada separada de campos publicados |
| Membresía | Usuario + complejo + rol; revocación efectiva y múltiples membresías |
| Cancha | Pertenece a un complejo; desactivación preservando historial |
| Horario / excepción / tarifa | Alcance por complejo y cancha, vigencia y precedencias explícitas |
| Cliente | Ficha comercial local del complejo; vinculación a identidad opcional y validada |
| Reserva | Complejo, cancha, intervalo UTC, cliente/jugador autorizado, precio y condiciones históricos |
| Ocupación | Registro común para reservas y bloqueos activos; evita conflictos entre ambos tipos |
| Bloqueo | Motivo interno y rango; el portal solo ve indisponibilidad |
| Conexión de pago | Complejo y cuenta receptora; credenciales cifradas y acceso restringido |
| Intento / pago / devolución | Relación inequívoca con reserva, complejo y proveedor; moneda e importes enteros |
| Evento de proveedor / auditoría | Deducción de duplicados, procesamiento y trazabilidad sin secretos |

Usar claves foráneas que impidan relacionar cancha de A con reserva de B. No basta con repetir `complex_id` sin validar sus relaciones. Restringir lecturas, altas, cambios y bajas mediante políticas y servidor. Las vistas y funciones públicas deben exponer únicamente campos permitidos.

### Garantía de disponibilidad

Proponer una tabla común de ocupaciones con rango `tstzrange` de límites `[)`, `inicio < fin`, alcance de cancha/complejo y restricción de exclusión GiST para rangos activos. Una restricción separada en reservas y otra en bloqueos no impide el choque entre ambas tablas. La creación y la modificación de reserva/ocupación deberán ser atómicas.

No introducir `now()` en un predicado para pretender que un índice libere reservas por tiempo. Si se aprueban vencimientos, una transición explícita y transaccional actualiza la ocupación usando la hora del servidor. Reprogramar no debe perder el horario original cuando el nuevo está ocupado. Registrar idempotencia de solicitudes y devolver conflictos comprensibles.

PostgreSQL documenta exclusiones combinando rangos y claves escalares; Supabase documenta RLS y migraciones versionadas. La elección concreta debe comprobarse contra la versión desplegada y los privilegios disponibles. [Rangos PostgreSQL](https://www.postgresql.org/docs/18/rangetypes.html), [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [migraciones Supabase](https://supabase.com/docs/guides/deployment/database-migrations).

### Reserva y pago son procesos separados

Preparar una tabla de transiciones con estado anterior, actor, precondición, efecto en disponibilidad, efecto financiero y respuesta a reintento. Diferenciar estado de reserva, pago, bloqueo y tiempo derivado. «En juego» no debe reemplazar la información de pago.

El webhook se autentica, el pago se consulta al proveedor y se validan cuenta receptora, reserva, moneda e importe antes de actualizar. Procesar de forma idempotente y tolerar desorden. No mantener una transacción de base abierta durante llamadas de red. Prever reintentos y reconciliación de estados inciertos. El retorno del checkout solo muestra el resultado verificado por el servidor. La documentación del proveedor contempla notificaciones firmadas y eventos de vinculación OAuth; el contrato exacto se verificará para el producto elegido. [Webhooks Mercado Pago](https://www.mercadopago.com.ar/developers/en/docs/zero-dollar-auth/additional-content/your-integrations/notifications/webhooks).

## 4. Decisiones pendientes y momento límite

Resolverlas con el responsable de producto al entrar en la fase que dependa de ellas. La planificación y la maquetación independiente pueden avanzar sin inventar respuestas.

| ID | Decisión requerida | Antes de | Trabajo independiente permitido |
| --- | --- | --- | --- |
| D01 | Resuelta: Supabase tipado y migraciones SQL; sin ORM adicional | F04 implementa ADR-001 | F01–F03 visuales |
| D02 | Confirmada: catálogo básico y enlace por complejo | F03/F08 implementan | Componentes de tarjetas y disponibilidad |
| D03 | Confirmada: alta asistida; equipo y conexión MP solo propietario | F04 implementa | Layout y formularios de acceso |
| D04 | Confirmada: invitado con nombre/email y enlace privado, sin cuenta obligatoria | F08 implementa; acceso de equipo separado | Estados visuales de acceso y recuperación |
| D05 | Duración, intervalos de inicio, anticipación, horizonte y turnos que cruzan medianoche | F05/F06 | Configuración visual con fixtures |
| D06 | Tarifas por turno/hora/franja; prioridad, vigencia y redondeo | F05/F06 | Presentación de importes enteros |
| D07 | Estados de reserva y cuáles ocupan cancha; confirmación manual o por pago | F06 | Agenda estática |
| D08 | Seña fija/porcentaje, saldo, vencimiento y tratamiento del pago tardío | F06/F09 | Infraestructura de pagos sin cambios de negocio |
| D09 | Cancelación, reprogramación, devolución, ausencia y excepciones por rol | F06/F09 | Detalle de reserva sin acciones pendientes |
| D10 | Cobros manuales: medios, correcciones, permisos y comprobantes | F07/F09 | Consulta de pagos verificados |
| D11 | Email privado de acceso confirmado; proveedor pendiente. Otros avisos siguen propuestos | F04 invitaciones / F08 invitado; F10 avisos adicionales | Mensajes dentro de la aplicación |
| D12 | Fórmula de ocupación, ingresos cobrados y saldo; reportes necesarios | F10 | Resumen de reservas sin métricas ambiguas |
| D13 | Suscripción de Turnero, alta comercial y suspensión por falta de pago | Piloto comercial / F12 | Operación de reservas independiente |
| D14 | Datos mínimos del cliente, retención, términos y textos de privacidad | F04 y salida pública | Inventario y minimización de datos |

Ejemplo de decisión que no puede omitirse: un pago llega después de liberar el turno y otra persona ya lo reservó. Debe existir una política aprobada y una salida operativa; jamás confirmar ambas reservas.

## 5. Fases ejecutables

Cada fase se divide en tareas pequeñas con salida demostrable. Un incremento puede ser un commit o una PR cuando exista repositorio. No cerrar una fase por tener pantallas si faltan sus garantías de datos o verificaciones.

### F00 — Cerrar el contrato del MVP

Ejecución documental realizada: [resultados y pendientes](producto/f00-decisiones.md). F00 no se marca completa mientras no se ejecute la validación externa de Mercado Pago. F01/F02 pueden continuar con las decisiones resueltas.

**Dependencia:** ninguna. **Resultado:** alcance y decisiones suficientes para ejecutar sin inventar reglas.

- F00.1: registrar D01–D14 con responsable, estado y resolución; resolver primero D01–D04.
- F00.2: definir mapa de rutas, recorridos mínimos y matriz de permisos. Distinguir propuesta de decisión confirmada.
- F00.3: hacer una comprobación breve de OAuth/cobro por vendedor en Mercado Pago con cuentas de prueba, documentando requisitos y posibles bloqueos antes de invertir en checkout.
- F00.4: preparar contrato de reserva/tarifa/transiciones D05–D10 antes de F05/F06; no frenar componentes por estas decisiones.

**Entregables previstos:** decisiones en `docs/architecture/` y `docs/producto/`, matriz de permisos y alcance del piloto. Crear solo archivos con contenido real.

**Aceptación:** cada operación del MVP tiene actor, alcance y resultado; las decisiones aún abiertas indican exactamente qué tarea bloquean. Sin reglas comerciales tomadas de textos de ejemplo.

### F01 — Inicialización reproducible

Estado al 26 de octubre de 2026: completada. Ver [implementación, verificaciones y límites](architecture/f01-inicializacion.md). Las tareas siguientes se conservan como alcance y criterio de aceptación de la fase.

**Dependencia:** decisiones técnicas de F00. **Resultado:** aplicación mínima que instala y compila.

- F01.1: inicializar Git local si corresponde y verificar instrucciones existentes; sin crear remotos o publicar por inferencia.
- F01.2: Next.js, TypeScript estricto y pnpm; fijar versiones compatibles y lockfile.
- F01.3: layouts de admin/jugador, CSS global, traslado de tokens y carga de Inter/Bricolage. Ajustar enlaces al archivo movido.
- F01.4: configurar lint, comprobación de tipos, Vitest, Playwright y build; documentar comandos reales en README y AGENTS.
- F01.5: `.env.example` sin secretos, exclusiones, validación de configuración y límites cliente/servidor.

**Aceptación:** instalación reproducible y build desde copia limpia; una sola fuente de tokens; rutas mínimas renderizan; controles de calidad configurados y ejecutados con resultados registrados. No declarar integraciones listas si solo existen variables.

### F02 — Sistema de interfaz y contrato responsive

**Dependencia:** F01. **Resultado:** componentes reutilizables y verificables.

- F02.1: mapear tokens a Tailwind/shadcn sin duplicar paleta; corregir variantes de portales de diálogo del jugador.
- F02.2: botones, campos, selectores, tarjetas, badges, filtros y horarios; estados de foco, deshabilitado y envío.
- F02.3: diálogos, menús, alertas, notificaciones, esqueletos y vacíos; foco y anuncios accesibles.
- F02.4: contenedores, navegación de cada área, cabeceras, grillas y barra inferior segura.
- F02.5: catálogo interno de demostración solo de desarrollo; comparación de componentes con referencias.

**Aceptación:** [especificación de maquetación](design/plan-maquetacion.md) aplicada en 390, 768, 1280 y 1440 px, más límites; teclado, zoom y movimiento reducido revisados. Tarjetas sin sombra y controles táctiles de 44 px o más. Capturas iniciales de componentes revisadas, no aprobadas automáticamente.

### F03 — Maquetación completa con datos de demostración

**Dependencia:** F02; D02 para la navegación pública definitiva. **Resultado:** prototipo navegable del MVP.

- F03.1: búsqueda móvil y reserva móvil; selección y resumen con estados explícitos de demostración.
- F03.2: búsqueda en tablet/escritorio y reserva amplia; adaptar sin escalar una captura.
- F03.3: calendario diario admin en móvil y escritorio; detalle y formulario de reserva.
- F03.4: panel, canchas, horarios/tarifas, clientes, equipo y configuración.
- F03.5: acceso/recuperación según D04, mis reservas, detalle, pago en proceso/error y pantalla final.
- F03.6: fixtures fijos, estados alternativos y capturas; anotar diferencias justificadas frente al HTML.

**Aceptación:** todos los recorridos del alcance tienen principio y fin navegables; sin enlaces ficticios. Admin móvil usa una cancha por vez. Ningún CTA oculta contenido. No presentar el prototipo como reserva o pago real. Los datos de demostración quedan aislados de producción.

### F04 — Identidad, complejos y seguridad

**Dependencia:** F01, D01, D03, D04 y definición de datos mínimos. **Resultado:** base multi-complejo segura.

- F04.1: entornos Supabase, migraciones iniciales, generación de tipos y datos de prueba de dos complejos.
- F04.2: autenticación, cierre de sesión, recuperación y estados de sesión vencida según método elegido.
- F04.3: creación autorizada del complejo y propietario inicial; membresías y cambios de rol según matriz.
- F04.4: contexto de complejo validado en servidor y selector para usuarios con varias membresías.
- F04.5: RLS y permisos por operación; protección de funciones, archivos y cachés si existen.
- F04.6: integrar las pantallas de acceso y equipo del prototipo.

**Aceptación:** un usuario de A no lee ni modifica B alterando IDs, URL o petición directa; tampoco mediante vistas o funciones. Usuario con A+B cambia contexto sin reutilizar datos del complejo anterior. Jugador sin membresía no accede a admin. Revocación y sesión vencida se prueban. No hay rol global de soporte implícito.

### F05 — Configuración operativa

**Dependencia:** F04, D05 y D06. **Resultado:** un complejo puede dejar sus canchas listas para recibir reservas.

- F05.1: perfil del complejo, publicación y campos públicos/privados.
- F05.2: canchas, deporte y atributos realmente incluidos; alta, edición y desactivación preservando historial.
- F05.3: horarios recurrentes locales, cierres/excepciones y operación nocturna conforme a las reglas.
- F05.4: tarifas, moneda ARS, vigencia y prioridades; importes en centavos enteros.
- F05.5: ficha de cliente aislada, búsqueda y edición; vínculo con jugador validado, sin fusionar por teléfono automáticamente.

**Aceptación:** formularios conservan datos al fallar; excepciones y tarifas no producen ambigüedades; cancha no publicada no aparece en portal; cambios futuros no reescriben precios de reservas existentes. Probar fechas locales y cruce de medianoche según contrato.

### F06 — Motor transaccional de disponibilidad y reservas

**Dependencia:** F05 y decisiones D07–D09. **Resultado:** operaciones de reserva seguras antes de exponerlas al público.

- F06.1: implementar estados y transiciones aprobadas; historial de acciones relevantes.
- F06.2: tabla común de ocupaciones, restricciones, relaciones de alcance y transacciones.
- F06.3: calcular disponibilidad desde horarios, excepciones, duración, reservas y bloqueos.
- F06.4: cotizar en servidor y crear reserva con precio/condiciones históricos e idempotencia.
- F06.5: bloquear cancha y modificar/cancelar/reprogramar solo según decisiones.
- F06.6: vencer ocupaciones únicamente si fue aprobado; reloj de servidor y carreras entre pago, vencimiento y cancelación.

**Aceptación:** peticiones concurrentes sobre el mismo rango dejan una sola ocupación; reserva contra bloqueo también. Turnos contiguos se permiten. Reprogramación fallida conserva el original. Doble clic/reintento no duplica. Precio manipulado y relaciones entre complejos se rechazan. Estas pruebas corren contra PostgreSQL real, no solo mocks.

### F07 — Operación administrativa real

**Dependencia:** F03, F04–F06; D10 para cobro manual. **Resultado:** equipo del complejo opera desde la agenda.

- F07.1: calendario diario, fecha, selector de cancha, filtros y leyenda; carga/vacío/error.
- F07.2: crear reserva desde horario libre, buscar/crear cliente y abrir detalle.
- F07.3: acciones autorizadas, bloqueo de cancha y conflictos de disponibilidad con recuperación.
- F07.4: navegación diaria y estado temporal basado en tiempo de servidor; refrescar datos sin borrar una edición.
- F07.5: resumen del día con datos reales; separar deuda de estado de reserva.

**Aceptación:** recorrido completo por teclado y móvil; pantalla vieja no permite sobrescribir cambios silenciosamente; conflicto muestra alternativa sin perder datos. Panel y calendario coinciden. El indicador «ahora» no autoriza transiciones desde el navegador.

### F08 — Portal del jugador con disponibilidad real

**Dependencia:** F03, F04 y F06; D02 y D04 resueltas. **Resultado:** selección y creación de reserva pública en entorno de prueba.

- F08.1: publicar catálogo básico y entrada por complejo conforme a D02; no incluir distancias ni geolocalización.
- F08.2: filtros válidos, fecha local, tarjetas y disponibilidad publicada; conservar búsqueda al volver.
- F08.3: selección de complejo/cancha/día/horario; cotización y resumen explícito antes del envío.
- F08.4: reserva invitada con nombre/email y creación transaccional; envío de enlace privado y recuperación de acceso sin cuenta. Proveedor de email y entrega verificable son dependencias de esta fase. `/mis-reservas` es entrada de recuperación, no consulta libre por email.
- F08.5: recuperación de horario ocupado, sesión vencida, precio cambiado, envío incierto y red interrumpida.

**Aceptación:** manipular IDs no expone reservas de otro invitado; ni contactos ni motivos internos aparecen en disponibilidad. El precio se verifica en servidor. Seleccionar no garantiza cancha. Un envío incierto se consulta antes de permitir una duplicación. Probar enlaces privados, recuperación sin enumeración y entrega de email; no exigir cuenta al invitado. No publicar pagos hasta F09.

### F09 — Mercado Pago por complejo

**Dependencia:** F04, F06, F08 y D08–D10. **Resultado:** cobros de prueba verificables y aislados.

- F09.1: conectar/desconectar cuenta por complejo con rol autorizado, OAuth protegido, credenciales de servidor y manejo de renovación/revocación.
- F09.2: crear intento de pago por la seña exacta calculada en servidor; idempotencia y referencia interna inequívoca.
- F09.3: verificar notificación y consultar pago; validar receptor, importe, moneda y reserva.
- F09.4: persistir eventos, deduplicar, procesar reintentos/desorden y reconciliar errores transitorios.
- F09.5: pantalla de retorno, estado pendiente, rechazo, aprobado y recuperación; aplicar política de pagos tardíos.
- F09.6: cobros manuales y devoluciones solo si fueron incluidos, con autorización y trazabilidad propias.

**Aceptación:** dos cuentas de prueba reciben sus propios cobros; firma inválida no cambia estados; evento duplicado no duplica efectos; retorno adulterado no confirma. Probar timeout tras crear pago, webhook anterior al retorno, pago tardío, cuenta desconectada y evento de otro vendedor. No registrar tokens en logs.

### F10 — Cierre funcional y operación comercial mínima

**Dependencia:** F07–F09; D11–D14 según alcance. **Resultado:** producto coherente para el piloto.

- F10.1: completar panel con indicadores definidos y conciliados con reservas/pagos; omitir métricas no aprobadas.
- F10.2: completar ajustes, ayuda operativa, perfil del complejo y detalle de reservas; verificar permiso de cada acción. No crear perfil de jugador fuera del alcance confirmado.
- F10.3: notificaciones únicamente si se aprobó canal y eventos; idempotencia, reintento y estado de entrega. Si no, retirar promesas de comprobantes enviados.
- F10.4: guía de alta de complejo, configuración, conexión de cobro y operación diaria.
- F10.5: registrar modalidad comercial inicial de Turnero, términos y tratamiento de datos; automatización de suscripciones separada.

**Aceptación:** un complejo nuevo puede completar el alta por el procedimiento elegido y operar sin editar registros improvisadamente. Textos públicos coinciden con reglas efectivas; no hay saldos, ingresos o confirmaciones ficticios.

### F11 — Calidad integral y piloto

**Dependencia:** F10. **Resultado:** versión candidata y piloto observado.

- F11.1: ejecutar regresión funcional, permisos, concurrencia, fechas y pagos con fixtures de dos complejos.
- F11.2: cerrar comparación visual móvil/tablet/escritorio; probar teclado, lector de pantalla, zoom, contraste y barras fijas.
- F11.3: revisar rendimiento con volumen representativo, consultas e índices; definir presupuesto de carga y latencia con mediciones.
- F11.4: configuración de producción, secretos separados, dominio/HTTPS, observabilidad sin datos sensibles y alertas operativas.
- F11.5: ensayar migración desde base vacía y actualización desde versión anterior; respaldo/restauración y reversión de aplicación compatible con esquema.
- F11.6: ejecutar piloto controlado con al menos dos complejos, registrar incidencias y corregir; activar cobros reales solo con configuración y decisión de lanzamiento explícitas.

**Aceptación:** cero defectos críticos de seguridad, dinero o sobreventa; flujos principales y restricciones pasan; evidencia visual revisada; procedimientos de recuperación ensayados; responsable operativo definido. Deploy exitoso por sí solo no cierra la fase.

### F12 — Evolución posterior, solo por alcance aprobado

**Dependencia:** piloto estable y datos de uso. No constituye autorización para implementar todo lo mencionado en las referencias.

| Paquete condicional | Preparación | Criterio de salida |
| --- | --- | --- |
| Suscripción del SaaS | Definir planes, pagador, facturación, impago y efectos sobre complejos | Cobro separado de señas; reintentos y recuperación probados; no perder reservas por suspensión |
| Reportes/exportación | Definir métricas, períodos, permisos y minimización de datos | Resultados conciliados y exportación con alcance validado |
| Calendario semanal/recurrentes | Definir series, excepciones y acciones parciales | Misma garantía de concurrencia que reserva individual |
| Avisos/WhatsApp | Proveedor, autorización, plantillas y eventos | Envío idempotente, bajas y fallos trazables |
| Descubrimiento geográfico | Fuente de ubicación, permisos y criterios de orden | Distancias comprobables y uso sin geolocalización |

Cada paquete debe abrir su propia especificación, tareas, diseños y pruebas antes de desarrollo. No preconstruir sus carpetas ni modelos.

## 6. Secuencia y puntos de control

Ruta recomendada: F00 → F01 → F02 → F03 → F04 → F05 → F06 → F07 → F08 → F09 → F10 → F11. F12 depende de decisiones posteriores.

F04 puede avanzar después de F01 mientras se termina maquetación, si sus decisiones están resueltas y hay capacidad de trabajo independiente. F07/F08 comparten motor y componentes; no duplicar reglas. La revisión de Mercado Pago en F00 reduce el riesgo de descubrir un bloqueo al final.

| Hito | Fases | Evidencia necesaria |
| --- | --- | --- |
| H1: base visual | F01–F03 | Prototipo navegable y capturas en tamaños acordados |
| H2: operación interna | F04–F07 | Dos complejos aislados y concurrencia validada |
| H3: reserva y cobro de prueba | F08–F09 | Recorrido jugador → pago verificado → agenda del complejo |
| H4: piloto | F10–F11 | Alta repetible, recuperación y operación observada |

No asignar fechas cerradas sin resolver alcance, capacidad del equipo y requisitos del proveedor. Al cerrar F00 estimar cada tarea; recalibrar después de H1. Priorizar dependencias y evidencias frente a una promesa de semanas sin base.

## 7. Matriz de pruebas obligatorias

| Riesgo | Prueba | Nivel / fase |
| --- | --- | --- |
| Fuga entre complejos | Usuario A consulta/modifica B por cada punto de entrada | Integración RLS + servidor, F04 en adelante |
| Cambio de contexto | Usuario A+B cambia complejo y revoca membresía | Integración y E2E, F04 |
| Fuga entre jugadores | Jugador consulta identificador ajeno | Integración y E2E, F08 |
| Sobreventa | Solicitudes simultáneas reserva/reserva y reserva/bloqueo | PostgreSQL real, F06 |
| Límites de intervalo | Contiguos, superpuestos, inicio igual a fin y medianoche | Vitest + PostgreSQL, F06 |
| Precio y moneda | Entrada adulterada, redondeo, tarifa vencida y snapshot histórico | Unidad + integración, F05/F06 |
| Reprogramación | Nuevo horario ocupado y carreras con otro operador | Integración, F06/F07 |
| Doble envío | Misma clave, reintento tras timeout y diferente payload | Integración, F06/F09 |
| Pago | Duplicado, desorden, firma falsa, importe/receptor incorrectos y pago tardío | Integración y entorno de prueba, F09 |
| Accesibilidad | Tab, Escape, foco restaurado, nombres, contraste, zoom y lector | Automática + manual, cada fase visual |
| Responsive | 320, 390, 768, 1024, 1280, 1440 y ancho intermedio | Playwright + revisión visual |
| Recuperación | Sesión expirada, red caída, servidor falla y estado incierto | E2E, F07–F11 |
| Despliegue | Migraciones, actualización, respaldo y restauración | Ensayo en entorno de prueba, F11 |

## 8. Contrato de ejecución de cada tarea

1. Leer AGENTS, esta fase, decisiones vinculadas y código existente.
2. Identificar precondiciones y decisiones bloqueantes. Preguntar solo por la decisión necesaria y continuar trabajo independiente.
3. Implementar un incremento delimitado, incluyendo estados responsive y validación de entradas.
4. Ejecutar verificaciones apropiadas, registrar comandos reales y evidencia; no simular resultados.
5. Entregar archivos cambiados, comportamiento, capturas si hay interfaz, pruebas ejecutadas y pendientes.
6. Actualizar estado de la tarea únicamente si cumple su aceptación. No avanzar de una maqueta a una integración real sin cerrar la garantía correspondiente.

Siguiente incremento habilitado tras la preparación documental de F00: ejecutar F01 y F02 para obtener una base visual revisable, conservando los pendientes comerciales y la prueba de Mercado Pago registrados en F00.

## 9. Verificación de esta planificación

Se inventariaron los seis archivos originales, se leyó su contenido documental, se extrajeron las plantillas del HTML y se revisaron las ocho páginas visuales. Se contrastaron las propuestas críticas de base de datos y pagos con documentación oficial. No se ejecutaron lint, build, Vitest, Playwright ni pruebas de base: la aplicación aún no existe. La fidelidad visual futura se comprobará conforme al documento de maquetación; no está certificada por este plan.
