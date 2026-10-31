# Turnero Canchas

SaaS de gestión y reservas deportivas para múltiples complejos. Interfaz en español argentino y moneda inicial ARS.

## Estado

F05 iniciada: alta, edición y desactivación de canchas, deportes y precio fijo por turno implementados localmente. Migraciones de canchas y horarios aplicadas en Supabase; listado autenticado verificado en `/admin/canchas`. Ver [configuración y límites de F05](docs/architecture/f05-canchas.md).

F03: prototipo navegable del jugador y la administración, sobre el sistema de interfaz F02. Catálogo, reserva invitada, recuperación privada, agenda, panel, canchas, clientes, equipo y configuración con datos ficticios. Disponible solo en desarrollo bajo `/demo`; no es un sistema de reservas operativo.

F04 en curso: Supabase de desarrollo conectado, migración de identidad aplicada y tipos generados. `/admin` exige sesión y membresía vigente; hay ingreso, salida, recuperación y selección de complejo. Ver [configuración, verificaciones y pendientes de F04](docs/architecture/f04-base-identidad.md). Faltan el alta inicial del propietario, verificar el correo y completar invitaciones/recorridos autenticados. Reservas y Mercado Pago están pendientes. No desplegar esta base como un sistema de reservas funcional.

## Requisitos e instalación

### Continuar desde otra PC

Clonar el repositorio (o ejecutar `git pull --ff-only` en una copia existente sin cambios pendientes), usar las versiones de Node/pnpm indicadas abajo y ejecutar `pnpm install --frozen-lockfile`. Crear `.env.local` a partir de `.env.example` y configurar las credenciales por separado: Git no incluye `.env.local`. Luego ejecutar `pnpm dev`.

Punto de continuación: F05 incluye excepciones por jornada y vista de turnos por fecha. F06 incorpora el motor SQL de reservas pendientes con seña del 30%, espera de 15 minutos, idempotencia y exclusión de superposiciones. La migración `202610290003_pending_reservations.sql` todavía **no está aplicada al Supabase remoto**. Las migraciones de excepciones `202610290001` y restauración `202610290002` ya fueron aplicadas. Ver [estado y pendientes de F06](docs/architecture/f06-reservas.md) antes de conectar el formulario de reservas o pagos.

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

Para el prototipo F03 no se requieren credenciales. Para el acceso real de F04, copiar `.env.example` a `.env.local` y completar `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` con la URL y clave pública del proyecto. Nunca usar la clave secreta o service_role. `APP_URL` debe coincidir con el origen abierto en navegador, inicialmente `http://localhost:3000`; se valida como origen HTTPS salvo localhost. Ver la configuración de callbacks en el registro F04. `.env.local` no se versiona.

## Comandos reales

| Comando | Función |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo, puerto 3000 por defecto |
| `pnpm lint` | ESLint, cero warnings admitidos |
| `pnpm typecheck` | Genera tipos de rutas y ejecuta TypeScript sin emitir |
| `pnpm test` | Pruebas unitarias de configuración con Vitest |
| `pnpm test:db` | Migraciones, funciones y aislamiento RLS en PostgreSQL embebido; sin credenciales ni Docker |
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
- `src/app/admin/`: acceso del equipo, recuperación, selección y panel protegido.
- `src/features/auth/`: acciones de servidor y validación de sesión/membresías por petición.
- `src/lib/supabase/`: cliente de servidor, configuración validada y tipos generados desde Supabase.
- `src/lib/`: validación de configuración y acceso de servidor.
- `src/components/ui/`: componentes y contexto de área para portales.
- `src/components/layout/`: shell, cabecera y acciones inferiores.
- `src/app/dev/ui/`: catálogo interactivo exclusivo de desarrollo.
- `src/app/demo/`: entrada y validación de rutas del prototipo, cerradas en producción.
- `src/features/demo/`: pantallas, fixtures fijos y estado local sin persistencia; no usar como capa de negocio real.
- `src/styles/tokens.css`: única fuente de tokens; `globals.css` los importa y conecta con Tailwind.
- `tests/e2e/`: navegación, teclado, rutas y desbordamiento horizontal.
- `tests/database/`: pruebas SQL en memoria con infraestructura Auth mínima simulada; no verifica Supabase Auth ni su API.
- `supabase/migrations/`: esquema y permisos versionados; migración inicial aplicada al entorno de desarrollo.
- `docs/`: decisiones, plan y referencias originales.

Las fuentes provienen de paquetes Fontsource fijados y se sirven desde la aplicación; el build no consulta Google Fonts. Los tokens usan los nombres de familia variables de esos paquetes, sin cambiar la identidad visual. `components.css` define componentes consumiendo esos tokens; los portales reciben explícitamente `data-area` a través del contexto React.

## Verificación y límites

Ver los registros [F01](docs/architecture/f01-inicializacion.md), [F02](docs/architecture/f02-interfaz-responsive.md), [F03](docs/architecture/f03-prototipo.md) y [F04](docs/architecture/f04-base-identidad.md) para resultados y límites. Las pruebas de demo verifican recorridos visuales y cambios locales; las de F04 verifican SQL y RLS, sin integración de Auth/API. F04 sigue abierta.

ESLint 9.39.5 está fijado por compatibilidad con los plugins incluidos por `eslint-config-next` 16.4.3. El registro lo marca como deprecated; ESLint 10.13.0 produjo incompatibilidades de peer dependencies con import, JSX accessibility y React. Actualizar en conjunto cuando esas dependencias soporten la versión nueva. No se suprimieron reglas para ocultar la incompatibilidad.

Las instalaciones permiten scripts únicamente de `sharp`, `esbuild` y `unrs-resolver` mediante `pnpm-workspace.yaml`; revisar antes de ampliar esa lista. Los cambios de F04 se preparan para un commit posterior; consultar `git status` para el estado actual del checkout.

## Documentación del producto

- [Plan por fases](docs/plan-implementacion.md).
- [Decisiones F00](docs/producto/f00-decisiones.md).
- [Alcance, rutas y permisos](docs/producto/alcance-rutas-permisos.md).
- [Maquetación responsive](docs/design/plan-maquetacion.md).
- [Acceso a datos y migraciones](docs/architecture/adr-001-datos-migraciones.md).

El jugador reservará como invitado con nombre/email y enlace privado. Las reglas de duración, tarifa, seña, vencimiento y cancelación siguen pendientes; no convertir ejemplos visuales en reglas de negocio.
