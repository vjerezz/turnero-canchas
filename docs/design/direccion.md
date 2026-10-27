# Dirección de diseño — Turnero Canchas

Estado: dirección visual aprobada para la primera versión, con tema claro.

## Propósito y referencias

Este documento define la identidad visual y los criterios de experiencia de Turnero Canchas. Se aplica al panel administrativo y al portal de jugadores.

- [AGENTS.md](../../AGENTS.md) define cómo trabajar en el proyecto y las restricciones técnicas y de negocio.
- [tokens.css](../../src/styles/tokens.css) es la fuente única de los valores visuales, trasladada durante F01.
- Los archivos de `screens/` muestran la dirección visual y composiciones de referencia.

La aprobación corresponde a la identidad visual. Los datos, textos comerciales y funcionalidades de las maquetas son ejemplos; no definen por sí solos el alcance del MVP ni políticas de reservas o pagos.

## Contexto del producto

Turnero Canchas es un SaaS de gestión y reservas deportivas para múltiples complejos independientes desde el primer MVP.

Cada complejo administra sus propias canchas, equipo, clientes, horarios, tarifas y reservas, y cobra las señas en su propia cuenta de Mercado Pago. La interfaz debe dejar claro qué complejo se está administrando y a cuál pertenece una reserva. El historial comercial de un complejo no se comparte con otros.

El producto tiene dos experiencias con una identidad común:

- **Administración:** rapidez para operar, calendario legible y densidad de información controlada.
- **Jugador:** búsqueda y reserva simples, con prioridad en el uso desde el celular.

## Principios de diseño

- **Claridad:** mostrar primero la información necesaria para resolver la tarea actual.
- **Sobriedad:** fondos claros, texto tinta, bordes suaves y decoración mínima.
- **Energía deportiva:** usar Volt en acciones y selecciones relevantes, sin saturar la pantalla.
- **Consistencia:** repetir componentes, vocabulario y patrones de interacción entre pantallas.
- **Confianza:** mostrar horarios, importes, estados y consecuencias de una acción de forma explícita.
- **Accesibilidad:** comunicar con texto, estructura y señales visuales que no dependan únicamente del color.

La identidad es propia de Turnero Canchas. Otras plataformas pueden servir como referencia funcional, sin copiar su interfaz o identidad gráfica.

## Identidad visual aprobada

### Color

La paleta está definida en `tokens.css`. Los componentes deben consumir sus nombres semánticos y no introducir colores sueltos.

| Elemento | Uso |
| --- | --- |
| Blanco y superficie neutra | Fondos, paneles y separación de áreas |
| Tinta | Texto principal, navegación y acción principal del administrador |
| Volt | Acción principal del jugador, selección de horarios y acentos deportivos |
| Azul cancha | Enlaces, foco y apariencia de reservas confirmadas |
| Verde, ámbar y rojo | Éxito, atención y error, acompañados de texto o iconos |

Volt se usa como relleno con texto tinta; nunca como texto sobre blanco. El color de selección debe distinguirse de la información sobre disponibilidad o pago mediante etiquetas e iconos.

El tema inicial es claro. No generar una paleta oscura ni nuevas identidades por complejo como parte de esta implementación.

### Tipografía

- **Inter:** cuerpo, navegación, tablas, formularios, etiquetas y títulos menores de 20 px.
- **Bricolage Grotesque:** títulos y cifras destacadas de 20 px o más.
- Aplicar cifras tabulares a horarios, precios y métricas para mantener la alineación.
- Usar la escala de tamaños e interlineados de los tokens; no reducir texto por debajo de 12 px para hacer entrar contenido.
- Permitir zoom, saltos de línea y crecimiento del contenido sin recortes.

### Espaciado, radios y elevación

- Usar la escala de espaciado con base de 4 px.
- Dentro de tarjetas y entre tarjetas, priorizar 16–24 px; entre secciones, 48–64 px según el espacio disponible.
- Radios: 8 px para controles, 12 px para tarjetas internas y 16 px para tarjetas principales y modales. Filtros y etiquetas pueden usar radio completo.
- Separar tarjetas mediante borde de 1 px. Reservar la sombra flotante para menús, notificaciones y modales.
- Evitar gradientes decorativos, sombras intensas y efectos que compitan con la lectura del calendario.

## Componentes e interacción

Usar una base compartida para botones, formularios, tarjetas, tablas, filtros, modales, notificaciones y estados. Adaptar shadcn/ui al sistema visual y reutilizar componentes existentes antes de crear otros.

- **Acciones:** una acción principal clara por contexto. Tinta en administración y Volt con texto tinta en el portal.
- **Tamaños:** controles estándar de 40 px en escritorio; botones principales de 48 px en móvil. Los objetivos táctiles deben medir al menos 44 px. Los controles compactos de 32 px se reservan para contextos de escritorio apropiados.
- **Formularios:** etiqueta siempre visible, ayuda o error junto al campo y conservación de los datos cuando falla el envío. El placeholder no reemplaza la etiqueta.
- **Foco:** indicador visible azul de 2 px, con separación suficiente respecto del control.
- **Confirmaciones:** reservar los modales de confirmación para acciones con consecuencias difíciles de revertir y describir el efecto concreto.
- **Feedback:** mostrar carga, éxito, error y ausencia de datos. No presentar una reserva o un pago como confirmado antes de verificarlo con el servidor.
- **Notificaciones:** mensajes breves con una acción opcional. La información crítica y los errores que requieren acción deben seguir disponibles en la pantalla.
- **Estados vacíos:** explicar la situación y ofrecer un siguiente paso cuando corresponda.
- **Carga:** usar indicadores o esqueletos que preserven la estructura y reduzcan saltos de contenido.

## Panel administrativo

El calendario es la herramienta central de operación. Debe permitir localizar una cancha, interpretar su disponibilidad y abrir una reserva con pocos pasos.

- Mantener visible el complejo activo; si existe un selector de complejo, el contexto debe seguir siendo claro en todas las pantallas.
- Priorizar las reservas del día, los próximos turnos y los estados que requieren una acción.
- Organizar tablas y métricas con jerarquía y alineación consistentes. Mostrar indicadores solo cuando exista una definición y una fuente real de datos.
- Mantener navegación estable y acciones frecuentes accesibles.
- En escritorio, usar la barra lateral y una agenda con varias canchas cuando el espacio lo permita.
- En móvil, adaptar la navegación a un formato compacto y mostrar el calendario por cancha, evitando reducir la agenda completa hasta volverla ilegible.

## Portal del jugador

El flujo debe permitir identificar el complejo, consultar disponibilidad, elegir un turno y comprender el precio y las condiciones antes de confirmar.

- Priorizar móvil, tarjetas legibles y acciones fáciles de alcanzar.
- Usar Volt de forma más visible que en administración, conservando los mismos componentes y tipografías.
- Mostrar siempre el complejo, la cancha, la fecha y el intervalo seleccionado antes de confirmar.
- Separar precio total, seña y saldo pendiente cuando el modelo comercial definido lo requiera.
- Distinguir visualmente un horario elegido de uno reservado u ocupado. Un horario elegido todavía no garantiza una reserva.
- La barra de acción fija en móvil debe respetar las áreas seguras y no tapar contenido, controles ni mensajes.

## Calendario y comunicación de estados

Los estilos de agenda ayudan a leer la operación; no constituyen un modelo de datos ni una lista única de estados de negocio.

| Señal visual | Presentación |
| --- | --- |
| Disponible | Fondo claro, contorno visible y acción para seleccionar |
| Confirmada | Azul con etiqueta de confirmación |
| Seña pendiente | Ámbar con texto que explique qué falta |
| En juego | Acento Volt y etiqueta de turno en curso |
| Completada | Superficie neutra y etiqueta |
| Cancelada | Etiqueta explícita; rojo cuando corresponda comunicar la cancelación |
| Bloqueada u ocupada | Trama y texto que indiquen la condición; distinguir su motivo cuando sea visible para ese usuario |

Separar en el modelo y en la presentación el estado de reserva, el estado de pago, los bloqueos de cancha y el transcurso del turno. Cuando coincidan, mostrar la información relevante sin depender de un solo color.

Las políticas de cancelación, devolución, duración, porcentaje de seña y vencimiento deben definirse antes de implementar mensajes o automatizaciones sobre ellas.

## Responsive y accesibilidad

- Revisar como mínimo en anchos de 390, 768 y 1280 px, además de tamaños intermedios. Son referencias de revisión, no límites de compatibilidad.
- Adaptar navegación, grillas y calendarios al espacio; conservar información y acciones esenciales.
- Permitir uso por teclado, foco visible, etiquetas accesibles y manejo correcto del foco al abrir y cerrar diálogos.
- Usar texto o iconos con significado además del color; los iconos sin texto deben tener nombre accesible.
- Objetivo de accesibilidad: WCAG 2.2 AA. Verificar contraste y comportamiento sobre la interfaz implementada.
- No asumir que los componentes de una biblioteca garantizan por sí solos accesibilidad.

## Movimiento

Usar transiciones de 120–180 ms con salida suave para cambios de color, borde o movimientos pequeños. Al seleccionar un horario, la escala puede llegar a 1.02 sin desplazar el contenido adyacente.

Respetar `prefers-reduced-motion` usando los tokens previstos y adaptar cualquier animación adicional. Evitar rebotes, parallax y movimientos que retrasen una tarea o dificulten leer estados.

## Implementación y revisión

1. Revisar el flujo solicitado, los tokens, las referencias y los componentes disponibles.
2. Implementar únicamente la pantalla o el recorrido dentro del alcance de la tarea.
3. Mantener la identidad aprobada; no reiniciar la exploración de paleta y tipografías en cada tarea.
4. Verificar escritorio y móvil, teclado, textos largos y estados de carga, vacío, error y éxito.
5. Comprobar que las acciones y mensajes coincidan con las reglas de negocio definidas y con los permisos del usuario.
6. Documentar nuevos patrones reutilizables y justificar los cambios necesarios al sistema visual.

Una pantalla está lista cuando permite completar su tarea, mantiene la coherencia con el producto y comunica con claridad su estado. La fidelidad a una maqueta no reemplaza la validación de usabilidad, accesibilidad y reglas de negocio.
