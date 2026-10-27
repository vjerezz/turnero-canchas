# F01 — Inicialización y verificación

Inicio: 24 de octubre de 2026. Cierre retomado: 26 de octubre de 2026.

Estado: F01 completada, con el pendiente de actualización de ESLint documentado abajo.

## Implementación

- Git local inicializado en `main`, sin remoto, commits ni publicación.
- Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 estricto y Tailwind 4.3.3. Dependencias directas exactas y resolución en `pnpm-lock.yaml`.
- Node 24.12.0 y pnpm 11.25.0 documentados. pnpm es el único gestor.
- Layout raíz en español argentino; layouts independientes para `/` y `/admin`; página 404 con retorno al inicio.
- Tokens trasladados a `src/styles/tokens.css`, importados una sola vez desde `globals.css`. Enlaces documentales actualizados.
- Inter y Bricolage Grotesque variables servidas localmente mediante Fontsource; no requieren Google Fonts durante el build.
- Validación Zod de `APP_URL` y acceso por módulo `server-only`. Error de configuración sin exponer el valor recibido. `.env.example` sin secretos y archivos locales excluidos de Git.
- ESLint, Vitest y Playwright configurados; comandos reales y requisitos en [README](../../README.md).

## Verificaciones ejecutadas antes de la interrupción

| Comando / revisión | Resultado observado |
| --- | --- |
| `pnpm install --frozen-lockfile` | Correcto en proyecto y en copia independiente sin node_modules ni .next iniciales |
| `pnpm peers check` | Sin incompatibilidades de dependencias pares en la configuración final |
| `pnpm lint` | Correcto, sin warnings |
| `pnpm typecheck` | Correcto; tipos de rutas generados y TypeScript sin errores |
| `pnpm test` | 8 pruebas aprobadas: validación de origen y ausencia de credenciales en errores |
| `pnpm build` | Correcto en proyecto; rutas `/`, `/admin` y not-found generadas |
| `pnpm test:e2e` | 9 pruebas Chromium aprobadas: ambas rutas y recuperación de 404 a 390, 768 y 1280 px |
| Revisión visual | Inspeccionadas las seis capturas de portal/admin en esos tres anchos, sin recortes ni desbordamiento horizontal |
| Teclado | Playwright comprobó Tab, enlace de salto, foco en contenido y navegación entre áreas |

Las capturas incluyen el foco azul del contenido después de activar el enlace de salto. Son evidencia de la base F01, no comparación por píxel contra las pantallas completas de F03. Los reportes y capturas se generan en carpetas ignoradas; las pruebas están versionables en `tests/e2e/foundation.spec.ts`.

## Recuperación de la comprobación interrumpida

La instalación de la copia limpia terminó correctamente antes de la interrupción. Al retomar se encontró su `BUILD_ID`, pero la sesión original ya no conservaba el resultado del proceso. El 26 de octubre se repitió `pnpm build` en esa copia: terminó con código 0, compilación y tipos correctos, y las tres rutas generadas. Se compararon hashes de los 11 archivos fuente y cinco archivos de configuración/lockfile con el proyecto actual: 16 coincidencias, ninguna diferencia. La copia se instaló originalmente sin `node_modules` ni `.next`; la repetición de build utilizó esa instalación independiente.

## Limitaciones y siguiente fase

- ESLint 9.39.5 figura deprecated en el registro; se conserva por compatibilidad con los plugins de `eslint-config-next` 16.4.3. La prueba con ESLint 10.13.0 detectó peers incompatibles en import, JSX accessibility y React. Actualizar conjuntamente cuando haya soporte; no se deshabilitaron reglas para ocultarlo.
- Las pruebas de navegador cubren Chromium y los tres anchos indicados. No se certifica WCAG completo, Safari, Firefox ni los flujos de negocio todavía inexistentes.
- `/admin` es una base pública sin datos privados. Autenticación y autorización se implementan en F04; no confundir layout separado con protección.
- Supabase, RLS, Mercado Pago, correo y persistencia aún no están implementados. No se realizaron cobros ni pruebas de base de datos.
- shadcn/ui, componentes compartidos, catálogo interno de componentes y revisión visual detallada corresponden a F02.
- Las reglas comerciales y la prueba externa de Mercado Pago pendientes en F00 mantienen su estado.

El siguiente incremento previsto es F02, sobre la base de estilos y layouts existentes, sin crear todavía reservas reales.
