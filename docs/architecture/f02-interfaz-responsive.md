# F02 — Sistema de interfaz y contrato responsive

Fecha: 26 de octubre de 2026. Alcance: M01–M03 del plan de maquetación. Componentes y estructuras implementados; Firefox pendiente por limitación del entorno descrita abajo. No se implementan pantallas completas de F03 ni operaciones de negocio.

## Entrega

- Biblioteca interactiva en `/dev/ui`, disponible únicamente con `NODE_ENV=development`. En producción responde 404. Datos y validación de ejemplo locales; no guarda, reserva, cobra ni envía correos.
- Configuración manual de shadcn/ui en `components.json`, utilidad `cn`, variantes de botones y componentes propios adaptados a los tokens aprobados. Radix aporta Slot, Dialog/Sheet, DropdownMenu y Toast. No se ejecutó un generador que sobrescribiera los estilos. Select nativo para conservar el selector táctil del sistema.
- Botones principal/secundario/discreto/destructivo, deshabilitado y enviando; campos con etiqueta, ayuda y error asociado; tarjetas sin sombra; chips, horarios disponibles/seleccionados/ocupados/cargando; badges, alertas, vacío, esqueletos y avisos descartables.
- Diálogos con título/descripción, foco inicial, encierro de foco, Escape y retorno al disparador; panel lateral desplazable con límite de altura dinámica. Menú con teclado y cierre automático.
- `AreaProvider` propaga el área con contexto React; diálogo, menú y aviso reciben `data-area` incluso fuera del árbol DOM del portal. Administración usa tinta y jugador Volt. Los estados comerciales siguen siendo muestras visuales, no reglas implementadas.
- `AppShell` reutilizado en `/` y `/admin`: salto al contenido, navegación móvil y menú Más, sidebar admin desde 1024 px, contenedor público acotado y cabecera. Solo enlaces a destinos existentes; las secciones del catálogo son anclas locales.
- `BottomActions` mantiene su espacio en el flujo, contempla navegación inferior y safe area. Observa cambios de altura para reservar margen de desplazamiento a controles enfocados. El shell corrige el desplazamiento cuando WebKit deja un control enfocado detrás de una barra. En ventanas bajas las barras pasan al flujo normal.
- Dependencias directas exactas y lockfile: Radix 1.8.1, CVA 0.7.1, clsx 2.1.1, tailwind-merge 3.7.0, lucide-react 1.61.0 y axe para pruebas (versión exacta en package.json).

## Contrato visual aplicado

La fuente única sigue siendo `src/styles/tokens.css`. `globals.css` importa ese archivo una vez y mapea colores semánticos, tipografía y alias de radios/sombra a Tailwind. `components.css` contiene estilos, sin paleta literal nueva. Se corrigió el nombre de familia Bricolage para que coincida con `Bricolage Grotesque Variable` de Fontsource.

| Decisión | Aplicación / motivo |
| --- | --- |
| Contenedor máximo | 1280 px; límite de lectura compartido |
| Sidebar | 248 px desde 1024 px, según punto inicial del plan |
| Diálogo / panel / aviso | Máximos 512 / 448 / 400 px; límites fluidos con viewport |
| Navegación inferior | Base 72 px más safe area; admite crecimiento |
| Controles | 48 px móvil y mínimo 44 px escritorio: se prioriza el objetivo táctil sin áreas transparentes superpuestas sobre el nominal de 40 px |
| Campos | Texto de 16 px para evitar zoom involuntario al enfocar en móvil |
| Tarjetas | Padding 16 móvil / 24 amplio, borde 1, radio 16, sin sombra |
| Tipografía | Display 48/52 amplio, H1 32/38 móvil, H2 22/28, H3 Inter 17/24; cifras tabulares |
| Horarios | Grilla fluida con mínimo 112 px; filas crecen para mostrar estado textual |
| Movimiento | Animaciones y escala detenidas con preferencia de movimiento reducido |

Se incorporaron tokens de layout, tamaño de icono y muestras de color porque no estaban en la escala original. El catálogo es una composición nueva para revisar componentes: no pretende equivalencia raster con el tablero completo R01 ni con las futuras pantallas R02–R06. Se revisaron las referencias R01 y las capturas actuales; prevalecen los tokens aprobados. Las diferencias intencionales incluyen objetivos de 44 px, tipografía mínima 12 px, completado neutro, tarjetas sin sombra y flujo móvil desplazable. No se declara comparación pixel a pixel aprobada de pantallas todavía no implementadas.

## Verificación

Las suites reproducibles están en `tests/e2e/foundation.spec.ts` y `tests/ui/catalogue.spec.ts`. La biblioteca se prueba con servidor de desarrollo independiente; producción verifica el cierre de su ruta. Evidencia local generada en `test-results/ui` y reportes ignorados por Git.

- Validación estática: lint sin warnings, TypeScript y compilación de producción.
- Vitest: 8 pruebas de configuración.
- Producción: 12 pruebas Chromium (portal/admin, salto y navegación, 404 y catálogo no disponible) a 390, 768 y 1280 px.
- Interfaz: Chromium a 390/768/1280 y WebKit a 390 px; validación y preservación de datos, selección, controles deshabilitados, foco de diálogo, encierro/retorno de foco, tema de portales, menú y panel, avisos y actualización del estado vacío.
- Resultado de la última ejecución: 12/12 pruebas de interfaz aprobadas, además de 12/12 de producción y 8/8 unitarias. Lint, typecheck y build terminaron con código 0.
- Axe sobre catálogo y diálogos de ambas áreas, con reglas WCAG A/AA incluidas hasta 2.2. Cero infracciones detectadas en esas vistas; no equivale a certificación WCAG ni a prueba con lector de pantalla humano.
- Reflujo a 320, 767, 1024 y 1440 px; controles visibles de al menos 44 × 44; texto raíz al 200% en viewport 640 × 450; movimiento reducido. Sin overflow horizontal de página en las pruebas.
- Recorrido Tab: comprobación de que el centro del control enfocado no queda tapado por barras. Capturas de ambas áreas, diálogos, viewport y texto ampliado para revisión visual.

La configuración nativa de WebKit en Windows omite enlaces al recorrer con Tab. En ese motor la prueba coloca el foco inicialmente en el enlace de salto y comprueba Enter y el recorrido posterior con Tab. Chromium comprueba además descubrir ese enlace mediante Tab desde el inicio. No se cambió el comportamiento nativo de los enlaces para forzar un resultado de prueba.

### Límite de Firefox

Se descargó Firefox con Playwright, pero Windows impidió iniciar el ejecutable antes de cargar la aplicación (`spawn UNKNOWN`). La ejecución directa y el registro SideBySide identifican el ensamblado `mozglue` ausente. Es un fallo de arranque del navegador, no una prueba de interfaz aprobada. No se cambiaron componentes del sistema operativo. La configuración incluye Firefox al activar `TEST_FIREFOX=1`; se debe repetir en un entorno que pueda iniciarlo. La suite predeterminada utiliza Chromium y WebKit.

## Pendiente y siguiente fase

- F03: pantallas navegables y estados del catálogo de complejos, selección/reserva como invitado, recuperación privada y administración. Sus comparaciones con referencias se hacen sobre esas composiciones, no sobre esta biblioteca.
- Revisar las pantallas integradas con lector de pantalla y dispositivo móvil real, incluyendo teclado virtual. La emulación y WebKit en Windows no certifican Safari/iPhone reales.
- La reproducción por píxel y los baselines de las pantallas completas quedan para F03. Esta entrega verifica geometría de componentes y comportamiento responsive.
- Autenticación, persistencia, RLS, concurrencia, pagos y correo siguen en sus fases. No cambia ninguna decisión comercial pendiente de F00.

Fuentes de implementación: [instalación manual shadcn/ui](https://ui.shadcn.com/docs/installation/manual), [Dialog Radix](https://www.radix-ui.com/primitives/docs/components/dialog), [migración al paquete Radix unificado](https://ui.shadcn.com/docs/changelog/2026-02-radix-ui). Las adaptaciones locales usan la paleta del proyecto, no el tema predeterminado de los ejemplos.
