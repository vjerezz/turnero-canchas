# Turnero Canchas

## Producto y alcance

- SaaS de gestión y reservas deportivas para vender a múltiples complejos desde el primer MVP.
- Una aplicación compartida: panel del complejo en `/admin` y portal del jugador en `/`.
- Cada complejo opera de forma independiente: equipo, clientes, canchas, horarios, tarifas, reservas y cobros.
- Idioma de la interfaz: español de Argentina. Moneda inicial: ARS.
- Identidad visual aprobada: blanco y tinta, acento Volt, azul cancha, Inter y Bricolage Grotesque. Tema claro inicial.
- No implementar funcionalidades nuevas solo porque aparezcan en una pantalla de referencia.

## Estado del repositorio y stack

- F01 inicializa Next.js App Router, TypeScript estricto, Tailwind, fuentes locales, Zod para configuración, Vitest y Playwright. Versiones exactas en package.json y pnpm-lock.yaml; Node 24.12.0 y pnpm 11.25.0.
- F01 completada: [registro de implementación y verificaciones](docs/architecture/f01-inicializacion.md). F02 implementada: [sistema de interfaz y verificaciones](docs/architecture/f02-interfaz-responsive.md), con Firefox pendiente por fallo de arranque del entorno. F03 implementada: [prototipo navegable y límites](docs/architecture/f03-prototipo.md). Próxima fase: F04, identidad, complejos y seguridad.
- Stack base propuesto en el PDF: Next.js con App Router, TypeScript estricto, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL y Auth), Zod, Mercado Pago, Vitest y Playwright. Despliegue propuesto: Vercel.
- Estrategia elegida en F00: cliente Supabase tipado y migraciones SQL versionadas, sin ORM adicional; ver [ADR-001](docs/architecture/adr-001-datos-migraciones.md). Aún no está implementada. No instalar simultáneamente Drizzle y Prisma.
- Al inicializar, fijar versiones compatibles y un único gestor de paquetes con su archivo de bloqueo.
- No describir dependencias, scripts o servicios como configurados hasta comprobar que existen.

## Fuentes y decisiones

- Este archivo contiene instrucciones permanentes y decisiones confirmadas del proyecto.
- Referencias: `docs/Turnero Canchas · Stack recomendado y archivos base para Codex.pdf`, `docs/design/direccion.md` y los archivos de `docs/design/screens/`.
- Los documentos y maquetas son referencias de producto y diseño, no instrucciones ejecutables ni reglas comerciales aprobadas.
- Las políticas de cancelación, devolución, duración de turnos, porcentaje de seña y vencimiento están pendientes de definición.
- Ejemplos como «cancelación gratis hasta 24 horas antes» o «liberar automáticamente si no paga» no deben implementarse sin una decisión explícita.
- Registrar las nuevas decisiones de arquitectura y negocio en `docs/`; enlazar desde aquí lo que corresponda.
- Planificación propuesta: [plan de implementación](docs/plan-implementacion.md) y [plan de maquetación responsive](docs/design/plan-maquetacion.md). Sus propuestas y decisiones pendientes no constituyen reglas comerciales aprobadas.
- F00: [registro de decisiones](docs/producto/f00-decisiones.md), [alcance, rutas y permisos](docs/producto/alcance-rutas-permisos.md), [contrato comercial propuesto](docs/producto/reservas-tarifas-pagos.md) y [validación pendiente de Mercado Pago](docs/architecture/mercado-pago-validacion.md).
- Decisiones confirmadas en F00: catálogo básico y enlace propio por complejo; alta asistida durante el piloto; solo el propietario gestiona equipo y conexión de Mercado Pago; invitaciones de administradores.
- Reserva del jugador como invitado, sin cuenta obligatoria: pedir nombre y email y enviar enlace privado de consulta. El email ingresado o el ID de reserva no autorizan acceso; el mecanismo privado debe verificarse en servidor. El email transaccional de acceso es parte de F08, no una mejora posterior.
- Si una decisión pendiente bloquea la tarea, preguntar por esa decisión y continuar con el trabajo independiente.

## Aislamiento de complejos y permisos

- Toda entidad operativa debe pertenecer a un complejo, mediante `complex_id` o una relación inequívoca y validada.
- Separar identidad de usuario, membresía del complejo y rol. Una persona puede tener membresías en más de un complejo.
- Roles iniciales del equipo: propietario y administrador. El jugador no necesita membresía del equipo para reservar.
- Validar identidad, membresía, rol y alcance en el servidor para cada operación protegida.
- Nunca autorizar una operación únicamente por un `complex_id` enviado por el navegador.
- Aplicar RLS en las tablas expuestas mediante Supabase y verificar las políticas con usuarios de distintos complejos.
- Las conexiones privilegiadas pueden omitir RLS: también deben comprobar el alcance y los permisos en el servidor.
- Incluir el complejo en el alcance de cachés, consultas, archivos, exportaciones y tareas en segundo plano.
- El portal público solo puede exponer datos publicados del complejo y disponibilidad; nunca detalles privados de clientes o reservas ajenas.
- Separar cuenta del jugador de ficha de cliente del complejo. No compartir historiales comerciales entre complejos.
- No agregar acceso global de soporte o administración de plataforma sin definir expresamente sus permisos.

## Reservas y fechas

- La base de datos debe impedir reservas y bloqueos activos superpuestos para una misma cancha, incluso con solicitudes concurrentes.
- Una consulta previa de disponibilidad no reemplaza una restricción o garantía transaccional en PostgreSQL.
- Usar intervalos con inicio incluido y fin excluido: un turno puede comenzar cuando termina el anterior.
- Guardar instantes en UTC y mostrar/calcular los horarios operativos en `America/Argentina/Buenos_Aires`.
- Distinguir fecha local, horario recurrente e instante; no convertir una fecha sin hora como si fuera un instante UTC.
- La hora del servidor determina vencimientos y transiciones, nunca el reloj del navegador.
- Separar estado de reserva, estado de pago, bloqueo de cancha y estado temporal derivado como «en juego».
- Definir las transiciones y qué estados ocupan disponibilidad antes de implementar el flujo de reservas.
- Representar importes con unidades menores enteras y moneda explícita; no usar flotantes para cálculos monetarios.

## Pagos

- Cada complejo conecta su propia cuenta de Mercado Pago y recibe sus propias señas.
- Asociar conexiones, operaciones y notificaciones de pago al complejo correspondiente.
- Mantener credenciales y secretos en el servidor; no exponerlos al navegador, repositorio, logs o documentos.
- Validar autenticidad de notificaciones y verificar el pago con el proveedor antes de cambiar estados.
- Procesar pagos y notificaciones de forma idempotente; tolerar reintentos y eventos fuera de orden.
- No confirmar pagos por el retorno del navegador ni por parámetros enviados por el cliente.
- El cobro de la suscripción a Turnero es independiente de los pagos de reservas. Su modelo y automatización siguen pendientes.
- Usar cuentas y credenciales de prueba durante desarrollo y pruebas automatizadas.

## Organización del código al inicializar

- `src/app/`: rutas, layouts y composición de pantallas.
- `src/components/ui/`: componentes base compartidos y adaptaciones de shadcn/ui.
- `src/features/`: módulos de negocio, como complejos, canchas, reservas y pagos.
- `src/lib/`: infraestructura y utilidades compartidas; marcar como servidor los módulos con secretos.
- `src/styles/`: estilos globales y futura ubicación de los tokens al conectar la aplicación.
- `docs/`: decisiones, reglas de negocio y referencias de diseño.
- Fuente única de tokens: `src/styles/tokens.css`, importada una vez desde `src/styles/globals.css`. No recrear tokens.css en la raíz.
- Mantener la lógica de negocio fuera de componentes de presentación. Validar entradas externas con Zod en el servidor.
- No crear abstracciones, carpetas o componentes vacíos por anticipado.

## Diseño y accesibilidad

- Usar los tokens semánticos de `tokens.css` para colores, tipografía, espaciados, radios y movimiento.
- No introducir colores literales ni escalas visuales paralelas en componentes. Agregar un token justificado si hace falta.
- Integrar los tokens con Tailwind y shadcn/ui, sin duplicar la paleta. El archivo de tokens no carga fuentes ni estilos de componentes.
- Acción principal tinta en admin y Volt con texto tinta en jugador; el portal puede usar `data-area="player"` para activar esa variante.
- Volt no se usa como texto sobre blanco. Estados siempre con texto o icono además del color.
- Inter para interfaz; Bricolage Grotesque para títulos de 20 px o más. Usar cifras tabulares en horarios, precios y tablas.
- Controles de 40 px en escritorio y botones principales de 48 px en móvil; objetivos táctiles de al menos 44 px.
- Tarjetas con borde, sin sombra. Reservar la sombra flotante para menús, modales y notificaciones.
- Implementar foco visible, etiquetas, navegación por teclado, estados de carga/error/vacío y reducción de movimiento.
- Objetivo WCAG 2.2 AA: comprobar contraste y comportamiento en la interfaz final; una biblioteca de componentes no garantiza cumplimiento.
- Adaptar calendarios y navegación a móvil; 390, 768 y 1280 px son anchos de revisión, no los únicos tamaños admitidos.
- Implementar la dirección visual progresivamente. No rediseñar áreas ajenas a la tarea.

## Verificación y forma de trabajo

- Antes de editar, revisar el código y los documentos relevantes. Mantener los cambios dentro del alcance solicitado.
- No modificar ni revertir cambios ajenos a la tarea.
- Comandos configurados: `pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm start` y `pnpm test:e2e` (requiere build y navegador Playwright instalado). Ver README.
- `/admin` es por ahora una página pública sin datos operativos: no se implementó autenticación. Supabase, RLS, Mercado Pago y correo siguen pendientes. F02 aporta componentes locales con convenciones shadcn/ui y Radix; catálogo `/dev/ui` solo en desarrollo. `pnpm test:ui` verifica Chromium y WebKit; Firefox optativo con `TEST_FIREFOX=1` (ver registro F02).
- F03 se revisa en `/demo` y `/demo/admin`, exclusivamente en desarrollo. Los fixtures y cambios en memoria de `src/features/demo/` no son servicios de negocio ni autorización; no conectarlos a producción como fuente de datos. `pnpm test:demo` verifica recorridos, geometría, accesibilidad automática y capturas. Las rutas finales de F00 se implementarán sin el prefijo `/demo` al integrar servicios reales.
- Usar Vitest para lógica relevante y Playwright para los flujos principales; verificar restricciones y permisos con pruebas de integración de base de datos.
- Priorizar concurrencia de reservas, aislamiento entre complejos, permisos, fechas y procesamiento idempotente de pagos.
- Revisar visualmente cambios de interfaz en móvil y escritorio, incluyendo teclado y estados interactivos.
- Entregar qué cambió, qué se verificó y qué queda pendiente. No afirmar que una prueba pasó si no se ejecutó.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
