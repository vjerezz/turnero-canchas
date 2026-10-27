# ADR-001 — Acceso a datos y migraciones

Fecha: 24 de octubre de 2026. Estado: elección técnica para el MVP durante F00. Responsable: Codex. Implementación en [F04](f04-base-identidad.md): primera migración aplicada, cliente tipado, tipos generados desde Supabase y pruebas SQL locales/remotas. Sigue pendiente la aceptación completa de sesiones, correo e invitaciones.

## Decisión

Usar PostgreSQL de Supabase, cliente Supabase tipado y tipos TypeScript generados desde el esquema. Usar migraciones SQL versionadas en `supabase/migrations/` como única fuente de cambios del esquema, restricciones, funciones, permisos y RLS. No incorporar Drizzle ni Prisma en el MVP. Usar pnpm y un único lockfile; fijar versiones compatibles al inicializar.

## Motivos y alternativas

El problema central requiere restricciones de rangos, transacciones, RLS y permisos por complejo. Mantener esas piezas en SQL evita un segundo mecanismo de migraciones y deja sus garantías visibles. El cliente tipado cubre consultas y RPC sin exigir ORM. El costo es escribir y probar SQL explícitamente; los tipos generados no sustituyen validación Zod ni pruebas de permisos.

Drizzle sería una alternativa si apareciera una necesidad concreta de consultas tipadas que no cubra el cliente. Prisma no aporta una necesidad demostrada en el alcance actual. Cualquier incorporación futura exige otro ADR que defina el único responsable de migraciones, sin mantener dos fuentes de esquema.

## Contrato de seguridad y acceso

1. Operaciones del equipo: servidor valida sesión, membresía activa, rol y complejo; consultas con contexto del usuario y RLS. El selector del navegador expresa intención, no autoridad.
2. Funciones: preferir `security invoker`. Si una operación necesita `security definer`, justificarla, fijar `search_path`, calificar relaciones, restringir `EXECUTE` y comprobar identidad/alcance dentro de la función. No asumir que una llamada RPC respeta RLS por sí sola.
3. Invitados: alta mediante endpoint de servidor con esquema Zod, límites de abuso e idempotencia. Acceso posterior mediante capacidad privada verificada, acotada a una reserva; nunca acceso anónimo a clientes/reservas por ID o email.
4. Los accesos privilegiados de invitado, webhook, bootstrap o tarea de sistema deben ser mínimos y explícitos. La llave privilegiada nunca llega al navegador. Un error del servidor no debe poder cruzar complejos por confiar en el cuerpo de la petición.
5. Lecturas públicas: campos publicados y disponibilidad agregada; sin datos privados ni motivos internos. RLS y permisos de vistas/funciones revisados independientemente.
6. Mutaciones de reserva: una operación transaccional de PostgreSQL modifica reserva y ocupación. Sin llamadas de red dentro de la transacción. Las rutas HTTP no permiten actualizar tablas relacionadas por separado saltando invariantes.
7. Relaciones entre entidades: claves foráneas/únicas compuestas cuando correspondan para garantizar que cancha, cliente, reserva y pago pertenecen al mismo complejo.

## Ciclo de migraciones

- Crear cambio SQL, revisar permisos/RLS y aplicar en base local o de prueba aislada.
- Generar tipos del esquema resultante y comprobarlos con la aplicación.
- Probar migración desde base vacía y desde el esquema anterior; registrar riesgo de datos y estrategia de recuperación antes de producción.
- Los datos de prueba no se aplican a producción. No modificar migraciones ya desplegadas: agregar una nueva.
- No editar esquema remoto de forma permanente sin capturar el cambio en migración.
- Restricción de exclusión para ocupaciones y estados activos se implementa en F06, después de resolver D07/D08; este ADR no fija políticas de vencimiento.

## Criterios de aceptación en F04/F06

Migraciones reproducibles; tipos actualizados; pruebas con A, B, usuario A+B, invitado y sesión revocada; RPC y rutas directas negativas; concurrencia real en PostgreSQL. Probar operaciones privilegiadas además de RLS. La elección queda documentada ahora, pero ninguna de estas verificaciones ha sido ejecutada todavía.

## Fuentes verificadas

Supabase documenta migraciones SQL versionadas y reconstrucción del entorno mediante migraciones y seed. [Database migrations](https://supabase.com/docs/guides/deployment/database-migrations).

RLS permite restringir acceso por fila; las conexiones con privilegios de bypass requieren controles adicionales. [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

Supabase recomienda `security invoker` y explica que `security definer` ejecuta con los privilegios de su creador. [Database functions](https://supabase.com/docs/guides/database/functions).
