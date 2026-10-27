# Turnero Canchas

SaaS de gestión y reservas deportivas para múltiples complejos. Interfaz en español argentino y moneda inicial ARS.

## Estado

F03: prototipo navegable del jugador y la administración, sobre el sistema de interfaz F02. Catálogo, reserva invitada, recuperación privada, agenda, panel, canchas, clientes, equipo y configuración con datos ficticios. Disponible solo en desarrollo bajo `/demo`; no es un sistema de reservas operativo.

`/admin` todavía es pública y no contiene datos operativos. Autenticación, Supabase, RLS, reservas, Mercado Pago y correo no están implementados ni conectados. Componentes locales con convenciones shadcn/ui y primitivas Radix; `components.json` conserva la integración sin regenerar la paleta. No desplegar esta base como un sistema de reservas funcional.

## Requisitos e instalación

- Node.js 24.12.0 (ver `.node-version`; rango admitido Node 24 desde esa versión).
- pnpm 11.25.0, único gestor del proyecto.
- Las versiones directas están fijadas en `package.json`; `pnpm-lock.yaml` fija la resolución.

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Abrir [portal local](http://localhost:3000) o [administración local](http://localhost:3000/admin).

Con `pnpm dev`, abrir [biblioteca F02](http://localhost:3000/dev/ui). Permite alternar Jugador/Administración y probar interacciones con datos ficticios. `/dev/ui` devuelve 404 con `pnpm start`; no es una ruta de clientes. No guarda ni envía datos.

Prototipo F03: [jugador](http://localhost:3000/demo), [administración](http://localhost:3000/demo/admin) e [índice de recorridos](http://localhost:3000/demo/recorridos). `/demo` y sus descendientes también devuelven 404 en producción. Los cambios de ejemplo se conservan solo en memoria al navegar y se reinician al recargar. Usar datos inventados en los formularios.

No se requieren credenciales externas para F01. Opcionalmente copiar `.env.example` a `.env.local` y configurar `APP_URL`. Se valida como origen HTTPS, salvo HTTP en localhost; sin credenciales, rutas, parámetros ni fragmentos. La configuración se lee mediante un módulo `server-only`. Las variables del navegador no deben contener secretos.

## Comandos reales

| Comando | Función |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo, puerto 3000 por defecto |
| `pnpm lint` | ESLint, cero warnings admitidos |
| `pnpm typecheck` | Genera tipos de rutas y ejecuta TypeScript sin emitir |
| `pnpm test` | Pruebas unitarias de configuración con Vitest |
| `pnpm test:watch` | Vitest interactivo |
| `pnpm build` | Compilación de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm exec playwright install chromium` | Instala el navegador de las pruebas E2E |
| `pnpm test:e2e` | Pruebas Chromium a 390, 768 y 1280 px |
| `pnpm test:e2e:ui` | Interfaz interactiva de Playwright |
| `pnpm exec playwright install chromium webkit` | Navegadores para la biblioteca F02 |
| `pnpm test:ui` | Interfaz F02: Chromium móvil/tablet/escritorio y WebKit móvil, teclado, axe, reflujo y movimiento reducido |
| `pnpm test:demo` | Recorridos F03, 19 pantallas, capturas, contraste automático, reflujo y geometría aprobada |

Para E2E ejecutar primero `pnpm build`. Playwright inicia y detiene su propio servidor de producción en `127.0.0.1:3100`; ese puerto debe estar libre. Reportes en `playwright-report/` y capturas/trazas en `test-results/`, excluidos de Git. No ejecutar build y typecheck simultáneamente si ambos están regenerando `.next`.

`test:ui` utiliza desarrollo en `127.0.0.1:3200` (lo inicia si está libre, o reutiliza ese servidor fuera de CI); no necesita build. Sus resultados quedan en `test-results/ui` y `playwright-report/ui`. Ejecutar suites secuencialmente: la suite de producción limpia su directorio de resultados padre. Para Firefox: instalarlo con Playwright y ejecutar en PowerShell `$env:TEST_FIREFOX='1'`, luego `pnpm test:ui --project firefox`, y finalmente `Remove-Item Env:TEST_FIREFOX`. En esta máquina Firefox no inicia: Windows informa que falta el ensamblado `mozglue`. Ver registro F02; no se considera verificado.

## Estructura

- `src/app/(player)/`: portal y layout con `data-area="player"`.
- `src/app/admin/`: presentación inicial de administración; protección prevista para F04.
- `src/lib/`: validación de configuración y acceso de servidor.
- `src/components/ui/`: componentes y contexto de área para portales.
- `src/components/layout/`: shell, cabecera y acciones inferiores.
- `src/app/dev/ui/`: catálogo interactivo exclusivo de desarrollo.
- `src/app/demo/`: entrada y validación de rutas del prototipo, cerradas en producción.
- `src/features/demo/`: pantallas, fixtures fijos y estado local sin persistencia; no usar como capa de negocio real.
- `src/styles/tokens.css`: única fuente de tokens; `globals.css` los importa y conecta con Tailwind.
- `tests/e2e/`: navegación, teclado, rutas y desbordamiento horizontal.
- `docs/`: decisiones, plan y referencias originales.

Las fuentes provienen de paquetes Fontsource fijados y se sirven desde la aplicación; el build no consulta Google Fonts. Los tokens usan los nombres de familia variables de esos paquetes, sin cambiar la identidad visual. `components.css` define componentes consumiendo esos tokens; los portales reciben explícitamente `data-area` a través del contexto React.

## Verificación y límites

Ver los registros [F01](docs/architecture/f01-inicializacion.md), [F02](docs/architecture/f02-interfaz-responsive.md) y [F03](docs/architecture/f03-prototipo.md) para resultados y límites. Las pruebas de demo verifican recorridos visuales y cambios locales; no verifican reservas, pagos ni permisos reales: esas funciones todavía no existen. F04 es la próxima fase.

ESLint 9.39.5 está fijado por compatibilidad con los plugins incluidos por `eslint-config-next` 16.4.3. El registro lo marca como deprecated; ESLint 10.13.0 produjo incompatibilidades de peer dependencies con import, JSX accessibility y React. Actualizar en conjunto cuando esas dependencias soporten la versión nueva. No se suprimieron reglas para ocultar la incompatibilidad.

Git está inicializado localmente en `main`, sin remoto ni publicación. Las instalaciones permiten scripts únicamente de `sharp`, `esbuild` y `unrs-resolver` mediante `pnpm-workspace.yaml`; revisar antes de ampliar esa lista.

## Documentación del producto

- [Plan por fases](docs/plan-implementacion.md).
- [Decisiones F00](docs/producto/f00-decisiones.md).
- [Alcance, rutas y permisos](docs/producto/alcance-rutas-permisos.md).
- [Maquetación responsive](docs/design/plan-maquetacion.md).
- [Acceso a datos y migraciones](docs/architecture/adr-001-datos-migraciones.md).

El jugador reservará como invitado con nombre/email y enlace privado. Las reglas de duración, tarifa, seña, vencimiento y cancelación siguen pendientes; no convertir ejemplos visuales en reglas de negocio.
