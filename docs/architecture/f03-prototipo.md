# F03 — Prototipo navegable y responsive

Fecha: 26 de octubre de 2026. Alcance: F03.1–F03.6 y paquetes M04–M09 del plan de maquetación.

## Separación del producto real

El prototipo vive bajo `/demo`, solo en desarrollo. El layout y la página verifican `NODE_ENV` antes de cargar la interfaz. En producción `/demo` y sus descendientes devuelven 404. `/` y `/admin` conservan las presentaciones iniciales; muestran una entrada a la demo únicamente con `pnpm dev`.

Los fixtures están agrupados en `src/features/demo/`; no son un repositorio de producción, un mecanismo de autenticación ni una implementación de permisos. El proveedor conserva cambios en memoria durante la navegación; una recarga reinicia los ejemplos. No se usa almacenamiento persistente, no hay peticiones a servicios de negocio, no se crean reservas reales ni se envían emails. El formulario del jugador descarta nombre/email al salir; la ficha de resultado retiene solo selección e importe de ejemplo.

La aplicación compartida futura mantiene las rutas de F00 sin el prefijo `/demo`. La agrupación temporal mediante una ruta opcional validada permite revisar todas las pantallas sin publicar datos ficticios como si fueran operativos. Las rutas desconocidas no producen una pantalla ficticia arbitraria. Se leyó la documentación local de Next.js para layouts, páginas y parámetros asíncronos antes de implementarlas.

## Pantallas y recorridos

| Área | Rutas bajo `/demo` | Comportamiento de demostración |
| --- | --- | --- |
| Catálogo | `/` | Seis complejos, filtros de deporte/fecha/hora/barrio y cancha techada; vacío recuperable; filtros compactos en diálogo móvil |
| Complejo | `/complejos/[slug]` | Perfil publicado ficticio, servicios, canchas y acceso a selección |
| Reserva invitada | `/complejos/[slug]/reservar` | Día/cancha/horario, nombre y email, resumen; selección inválida se descarta al cambiar contexto; datos conservados ante error |
| Resultado | `/reservas/ejemplo` | Solicitud, pago en proceso/aprobado/rechazado/incierto y cancelación ilustrativos; reintento; total aceptado conservado |
| Acceso privado | `/reservas/[otro-id]`, `/mis-reservas`, `/acceso-reserva` | ID desconocido no muestra ficha; respuesta genérica por email; enlace inválido/vencido y canje explícitamente simulado de un ejemplo |
| Panel | `/admin` | Conteos derivados de fixtures, importe de turnos (no ingresos cobrados), canchas y próximos turnos |
| Agenda | `/admin/calendario` | Fecha, una cancha por vez en móvil, columnas en escritorio, detalle en panel lateral, alta de reserva o bloqueo local y conflicto de intervalo |
| Canchas | `/admin/canchas`, `/admin/canchas/nueva`, `/admin/canchas/[id]` | Lista, alta, edición, activación/desactivación y tarifa ilustrativa; formulario de apertura/cierre |
| Clientes | `/admin/clientes`, `/admin/clientes/[id]` | Búsqueda, alta, ficha, edición e historial por ID local de cliente dentro del complejo |
| Equipo | `/admin/equipo`, `/admin/invitaciones/aceptar` | Propietario: invitación local, duplicado, revocación con confirmación; aceptación, vencimiento y revocación ilustrativos |
| Configuración | `/admin/configuracion` | Vista previa de identidad pública, enlace propio y estados de conexión de Mercado Pago sin OAuth real |
| Acceso del equipo | `/admin/ingresar`, `/admin/recuperar-acceso`, `/admin/seleccionar-complejo` | Validación de campos ficticios, recuperación genérica, selección entre dos membresías de ejemplo |
| Índice | `/recorridos` | Acceso a las pantallas y puntos de entrada de cada recorrido |

En listas, catálogo, panel y agenda, “Estados de esta pantalla” permite alternar datos/carga/vacío/error/desactualización. En reserva se pueden reproducir conflicto, cambio de precio y error de conexión. El control de contexto permite revisar dos complejos y ambos roles; cambiarlo no otorga permisos reales. Las vistas de equipo y conexión muestran la experiencia restringida del administrador.

## Reglas que siguen pendientes

- Los 60/90 minutos, importes y estados son fixtures. No aprueban duración comercial, tarifa, porcentaje de seña, vencimiento ni cancelación.
- El formulario de horarios permite revisar apertura/cierre, pero no recalcula el motor de disponibilidad. Reglas semanales, excepciones y vigencias persistidas se implementarán en F05 después de D05/D06; el formulario lo indica.
- El conflicto local de agenda sirve para demostrar la recuperación de un error. No garantiza concurrencia ni reemplaza restricciones PostgreSQL.
- No hay botones de cancelación/reprogramación/cobro manual que simulen una política todavía no aprobada. El detalle explica la dependencia.
- La recuperación no enumera reservas por email. El acceso real con credenciales, cookies y verificación en servidor pertenece a F08.
- Los estados de pago se eligen como escenarios; no se infieren de retornos de Mercado Pago ni se marca un pago real.

## Comparación con referencias y adaptación

Se revisaron R02 (panel), R03 (agenda), R04 (búsqueda amplia), R05 (búsqueda móvil) y R06 (reserva móvil), además de los tokens y el plan. Las capturas actuales mantienen jerarquía, superficies, paleta, tipos, tarjetas con ilustración de cancha, grillas y estados. Las ilustraciones son SVG locales, sin descargas externas.

| Región | Geometría / decisión aplicada |
| --- | --- |
| Contenedor público | Máximo 1280 px; padding 16 móvil y 32 amplio |
| Hero público amplio | Display 48/52, padding 48, radio 16; formulario con borde y sin sombra |
| Búsqueda móvil | Título compacto y resumen que abre el formulario; evita desplazar los resultados por cuatro campos apilados |
| Resultados | Una columna móvil, dos intermedias, tres desde 1280; media 112/168 px; radio 16 |
| Agenda amplia | Columna horaria 56 px, encabezado 52 px y 72 px/hora; eventos posicionados proporcionalmente al intervalo |
| Agenda móvil | Selector de una cancha, tarjetas cronológicas; sin imponer un lienzo de cinco columnas |
| Reserva | Días de base 56 × 72 px; horarios en tres columnas cuando caben y dos a 320 px; selección Volt más icono/texto |
| Formularios | Una columna móvil; selección/datos y resumen en columnas en amplio; resumen al final del flujo móvil para no tapar campos con el teclado |
| Administración | Sidebar 248 px desde 1024; títulos 32/38; panel de detalle modal en lugar de comprimir cinco canchas y detalle en 1280 |

Diferencias intencionales: banner y controles de demostración; navegación sin perfil obligatorio de jugador; sin distancias, ranking, reportes ni vista Semana; completado neutro; importes descritos como ejemplos; sin promesas de cancelación gratuita ni liberación automática. La página móvil crece y se desplaza, en vez del recorte fijo de la referencia. La reserva incluye nombre/email por la decisión de invitado de F00. El shell de F02 conserva su cabecera compartida.

Las medidas clave se comprueban en navegador. No se declara equivalencia raster del 100% con las referencias: contienen diferencias funcionales no aprobadas y no hay composición original para varias pantallas. Las capturas revisadas forman la referencia propia normalizada del prototipo; no deben actualizarse en el futuro para ocultar regresiones. En capturas de página completa, la navegación fija aparece en la posición del borde del viewport inicial; el contenido continúa siendo desplazable.

## Verificación y evidencia

Resultado final: **67 pruebas aprobadas**: 8 unitarias, 15 de producción, 12 de componentes F02 y 32 del prototipo F03. Lint, comprobación de tipos y compilación de producción terminaron correctamente. La ejecución final de F03 se retomó tras una interrupción de la revisión automática por límite de uso y terminó con 32/32 aprobadas.

- `pnpm lint`, `pnpm typecheck`, `pnpm build` y las ocho pruebas Vitest de configuración.
- `pnpm test:e2e`: navegación de base y 404, más comprobación HTTP de las rutas demo en producción.
- `pnpm test:ui`: regresión de componentes F02, teclado, contraste, zoom y movimiento reducido.
- `pnpm test:demo`: recorridos del jugador, conflictos, precio modificado, acceso privado de ejemplo, ingreso del equipo, gestión local y cambio de complejo; inspección de 19 pantallas con axe y capturas en Chromium 390/768/1280 y WebKit 390.
- Reflujo adicional de pantallas clave a 320 px; texto al 200%; medidas de tarjetas, media, días y agenda. Las pruebas no certifican dispositivos reales ni lector de pantalla humano.

Capturas y reportes regenerables: `test-results/demo/`, `playwright-report/demo/`. Ejecutar primero producción, luego UI/demo: la suite de producción utiliza el directorio padre de resultados. Firefox mantiene la limitación de arranque registrada en F02; no se declara probado.

Se generaron capturas de 19 pantallas en las cuatro configuraciones de navegador/viewport. Revisión visual directa de catálogo, reserva, agenda, panel, clientes, equipo y configuración; comprobación automática de contraste y estructura en las 19 pantallas. No se detectaron infracciones axe en las vistas analizadas.

Se corrigieron durante la revisión: formulario móvil demasiado alto, cabecera administrativa que daba el mismo ancho al título y al botón, pérdida de una entrada anterior a la hidratación en WebKit, precio aceptado que no llegaba a la pantalla final y contexto de cancha al abrir el alta desde agenda móvil.

## Siguiente fase

F04: identidad, complejos, membresías, autenticación y aislamiento con Supabase/RLS. Requiere configurar el entorno de datos y convertir los controles de demo en operaciones de servidor verificadas. La existencia del prototipo no implica que esas protecciones estén implementadas ni habilita un piloto público.
