# Plan de maquetación precisa y responsive

Fecha: 24 de octubre de 2026. Complementa el [plan de implementación](../plan-implementacion.md). Estado: especificación propuesta para ejecutar F02–F03 y verificar cada integración posterior.

Ejecución F02, 26 de octubre: M01–M03 implementados en la biblioteca y los shells compartidos. Ver [contrato aplicado, diferencias y verificación](../architecture/f02-interfaz-responsive.md). M04–M09 siguen pendientes para F03; no se afirma comparación por píxel de esas pantallas.

Ejecución F03 posterior: M04–M09 implementados como prototipo de desarrollo. Ver [inventario, geometría y diferencias intencionales](../architecture/f03-prototipo.md). M10 continúa en cada integración: la referencia propia normalizada no equivale a copiar políticas ni recortes de las maquetas originales.

Actualización F00: [alcance confirmado](../producto/alcance-rutas-permisos.md). El jugador reserva como invitado con nombre/email y recibe enlace privado; no maquetar cuenta obligatoria, perfil o login del jugador. `/mis-reservas` sirve para recuperar acceso por email. Mantener acceso de equipo separado en `/admin/ingresar`. Las rutas propuestas inicialmente más abajo se subordinan a este alcance.

## 1. Qué significa fidelidad por píxel

Reproducir geometría, alineación, jerarquía, tipografía e iconografía en los viewports de referencia. Mantener comportamiento fluido fuera de ellos. No fijar toda la aplicación a 390 o 1440 px ni trasladar el recorte de las maquetas a producción.

Orden de prioridad: AGENTS y decisiones confirmadas → dirección visual y tokens → composición de referencia → adaptación propuesta. Cada diferencia intencional se registra. No modificar tokens para perseguir una captura que incumple los criterios aprobados.

Para pantallas sin referencia, primero crear una composición revisable siguiendo este sistema; luego convertirla en baseline visual. No se puede afirmar equivalencia exacta con un diseño inexistente.

## 2. Inventario visual comprobado

El HTML contiene seis tableros; el PDF divide el sistema de diseño en tres páginas. Sus medidas originales son:

| ID | Tablero | Tamaño HTML | PDF | Uso |
| --- | --- | --- | --- | --- |
| R01 | Sistema de diseño | 1440 × 2480 | 1–3 | Componentes y reglas |
| R02 | Admin · Panel | 1440 × 1010 | 4 | Panel escritorio |
| R03 | Admin · Calendario de reservas | 1440 × 1010 | 5 | Agenda y detalle escritorio |
| R04 | Portal jugador · Buscar canchas | 1440 × 1400 | 6 | Búsqueda escritorio |
| R05 | Jugador móvil · Buscar | 390 × 844 | 7 | Búsqueda móvil |
| R06 | Jugador móvil · Reservar | 390 × 844 | 8 | Reserva móvil |

El HTML embebe plantillas y recursos en un formato de exportación. Usarlo para inspeccionar medidas y obtener referencias, no como código de producción. Sus scripts no definen reglas comerciales.

## 3. Medidas: fuente y adaptación

### Valores aprobados que se conservan

| Elemento | Valor | Token / criterio |
| --- | --- | --- |
| Display | 48/52 px | `--text-display` / `--leading-display` |
| H1 | 32/38 px | `--text-h1` / `--leading-h1` |
| H2 | 22/28 px | `--text-h2` / `--leading-h2` |
| H3 | 17/24 px | `--text-h3`; Inter |
| Cuerpo | 15/22 px | `--text-body` |
| Tabla | 14/20 px | `--text-table` |
| Etiqueta | 12/16 px | `--text-label`; mínimo permitido |
| Página | 16 px móvil, 32 px escritorio | `--page-padding-*` |
| Tarjeta / separación | 16–24 px | Escala existente |
| Radios | 8 / 12 / 16 px | Control / interna / principal |
| Bordes / foco | 1 / 2 px, offset 2 px | Tokens existentes |
| Control / CTA móvil | 40 / 48 px | Área táctil mínima 44 px |
| Horario / badge / fila | 44 / 24 / 52 px | Alturas base; permitir crecer con texto |
| Transición | 120–180 ms | Sin rebote; escala de selección máxima 1.02 |

El tamaño de 40 px de un control de escritorio debe convivir con área de activación de al menos 44 px cuando corresponda al requisito táctil. No agrandar áreas transparentes de manera que se superpongan.

### Medidas extraídas del HTML, no aprobadas automáticamente

| Región | Medida observada | Tratamiento propuesto |
| --- | --- | --- |
| Sidebar admin | Base flexible 248 px, máximo 280 px | Fijar token de layout de 248 px como punto inicial; validar a 1280/1440 |
| Main admin | Padding 28/40/48 px | Usar 32/32/48 de escala aprobada y registrar diferencia |
| Agenda | Columna horaria 56 px, encabezado 52 px, 72 px por hora, mínimo 760 px | Crear tokens de geometría justificados; no imponer ancho mínimo de escritorio a móvil |
| Portal escritorio | Contenedor máximo 1280 px con padding horizontal 40 px; grilla con mínimo 340 px y gap 24 px | Mantener máximo 1280; padding aprobado 32; grilla adaptable |
| Hero escritorio | Título 60/62, radio 28, padding 56; formulario con sombra | Usar display 48/52, radio 16 y padding 48; sin sombra de tarjeta |
| Tarjeta pública | Imagen 168 px escritorio, 112 px móvil | Mantener como tokens de media propuestos, con proporción adaptable y sin deformación |
| Búsqueda móvil | Padding 16, campo y filtro 56 px, navegación con ítems de 56 px | Conservar geometría mediante tokens específicos si se requieren |
| Reserva móvil | Header 60 px; día 56 × 72; grilla de 3 columnas y gap 8 | Conservar estructura; convertir medidas nuevas a tokens documentados |
| CTA reserva móvil | 52 px, radio 14; selección escala 1.03 | Normalizar a 48 px, radio 8 y escala 1.02 |
| Tarjetas móviles | Radio 20 px | Normalizar a radio 16 |

Las medidas nuevas de layout son propuestas, no cambios ya aplicados a `tokens.css`. Antes de agregarlas documentar necesidad y reutilización. Fondos decorativos de canchas que no existen en la paleta semántica requieren un token justificado o una variante con los existentes; nunca copiar colores literales al componente.

## 4. Responsive primero

Escribir la base para móvil y ampliar según espacio disponible. Propuesta inicial: menos de 768 px compacto; desde 768 intermedio; desde 1024 amplio; desde 1280 escritorio completo. Los umbrales son hipótesis de layout que deben ajustarse si el contenido lo exige.

| Región | Móvil | Tablet / intermedio | Escritorio |
| --- | --- | --- | --- |
| Admin navegación | Complejo arriba; barra inferior Calendario, Panel y Más | Cabecera y menú compacto | Sidebar estable, complejo identificado |
| Panel | Secciones en una columna; métricas solo si caben | Dos columnas de métricas/tarjetas | Hasta cuatro métricas; contenido y próximos turnos en columnas |
| Agenda | Una cancha seleccionada, fecha y lista/columna horaria legible | Una o varias canchas según ancho útil | Varias canchas; overflow limitado al área de agenda si hace falta |
| Detalle de reserva | Diálogo de alto adaptable o pantalla completa | Drawer con formulario desplazable | Panel lateral si queda ancho; drawer en caso contrario |
| Resultados públicos | Una columna | Dos columnas cuando entren | Tres columnas dentro del contenedor |
| Búsqueda | Resumen y formulario en panel accesible | Campos distribuidos en dos columnas | Campos en fila si entran |
| Reserva | Selección y resumen en columna; CTA inferior | Selector y resumen pueden separarse | Selección principal + resumen lateral |
| Tablas | Tarjetas con campos esenciales o scroll localizado con encabezados | Columnas prioritarias | Tabla completa |
| Formularios | Una columna | Dos solo para campos relacionados | Ancho acotado; evitar inputs innecesariamente largos |

A 1280 px no forzar sidebar + cinco canchas + detalle lateral si vuelve ilegible cada columna. Retirar el detalle al drawer antes de reducir texto. A 320 px reducir columnas de horarios o dejar crecer filas, manteniendo 44 px de área táctil.

Usar `min-width: 0`, grillas flexibles y crecimiento vertical. Evitar alturas rígidas para textos, tarjetas y pantallas. Barras fijas con `safe-area-inset-bottom`, espacio reservado equivalente y revisión con teclado virtual. Los chips/días pueden desplazarse horizontalmente; la página completa no debe hacerlo.

## 5. Pantallas y orden de construcción

Las rutas siguientes son especificación de información, no rutas ya implementadas. El catálogo de `/` fue confirmado en D02; `/complejos/[slug]` conserva contexto inequívoco al reservar.

| Orden / pantalla | Ruta propuesta | Referencia | Entrega y estados propios |
| --- | --- | --- | --- |
| 1. Búsqueda pública | `/` | R04/R05 | Formulario, filtros, resultados, sin resultados y error de disponibilidad; catálogo básico confirmado |
| 2. Complejo y selección | `/complejos/[slug]` y `/complejos/[slug]/reservar` | R06 parcial | Día, cancha, horario, resumen; sin selección, ocupado, precio cambiado y complejo no publicado |
| 3. Resultado de reserva/pago | `/reservas/[id]` | Confirmación embebida en HTML R06 | Pendiente, confirmado, error, acceso denegado y cancelado si existe transición |
| 4. Recuperar reserva | `/mis-reservas`, `/acceso-reserva` | Sin composición | Solicitud de enlace por email, respuesta genérica y enlace inválido/vencido; sin historial público por email |
| 5. Acceso de equipo | `/admin/ingresar`, `/admin/recuperar-acceso` | Sin composición | Etiquetas, errores, envío y retorno seguro al panel; sin cuenta obligatoria del jugador |
| 6. Calendario admin | `/admin/calendario` | R03 | Fecha/cancha, agenda, detalle, crear y conflicto; primer diseño móvil nuevo |
| 7. Panel admin | `/admin` | R02 | Resumen real y próximas reservas; no inventar indicadores |
| 8. Canchas | `/admin/canchas` | Sin composición | Lista, alta, edición, desactivación y validaciones |
| 9. Horarios / tarifas | `/admin/canchas/[id]` | Sin composición | Reglas, excepciones, vigencias y vista previa de disponibilidad |
| 10. Clientes | `/admin/clientes` | Sin composición | Lista/búsqueda, detalle local, alta y edición |
| 11. Equipo | `/admin/equipo` | Sin composición | Membresías, invitaciones si se aprueban, roles y revocación |
| 12. Configuración / cobros | `/admin/configuracion` | Sin composición | Perfil, publicación y conexión Mercado Pago; error/revocación de cuenta |

No agregar Reportes, Ayuda compleja, notificaciones o vista Semana solo porque exista una entrada en la maqueta. Retirar entradas fuera del MVP y documentar la diferencia visual.

### Búsqueda móvil

Mantener orden R05: marca, título, búsqueda, filtros, cantidad de resultados, tarjetas y navegación. Adaptación confirmada F00: reemplazar cuenta/perfil del jugador por acceso a recuperación de reserva, sin login obligatorio. Padding 16; gaps 8/16/24 según nivel. La tarjeta conserva nombre, ubicación publicada, precio y horarios. Nombre largo y precio alto pueden distribuirse en dos filas. La segunda tarjeta debe estar completa al desplazarse; el recorte del tablero es solo el límite de la captura.

### Selección de reserva

Mantener orden R06: volver, complejo, día, cancha, horario, resumen y CTA. Día activo en tinta y horario elegido en Volt con check. Cambiar día/cancha invalida selección incompatible y actualiza precio. La barra inferior muestra complejo/cancha/fecha/intervalo y total/seña/saldo cuando estén definidos. Mostrar condiciones antes de enviar. El éxito depende del servidor, no de una animación local.

### Calendario

Geometría inicial: columna horaria de 56 px y 72 px/hora en escritorio. Posición del evento proporcional a minutos desde el inicio visible; alto proporcional a duración. No convertir la altura visual en duración comercial. Eventos muy cortos deben tener una alternativa de lista/detalle accesible sin falsear ocupación. Encabezados y hora visibles al desplazar; navegación por teclado y etiquetas con cancha, intervalo y estado.

Detalle con cliente, cancha, fecha/intervalo, estado de reserva, pagos y acciones por permiso. Datos privados solo en admin. En móvil, abrir detalle devuelve el foco al turno al cerrar. No exigir arrastrar para reprogramar.

### Formularios y pantallas sin referencia

Reutilizar cabecera, tarjeta y campos del sistema. Orden: contexto, datos necesarios, ayuda/validación y acción. Error de campo junto al control y error general persistente. Al guardar, impedir duplicado sin borrar datos. Usar confirmación adicional solo para consecuencias difíciles de revertir. Diseñar primero móvil, luego tablet y escritorio con los mismos componentes.

## 6. Estados y accesibilidad por componente

| Componente | Estados mínimos | Interacción / verificación |
| --- | --- | --- |
| Botón | Normal, hover, foco, presionado, deshabilitado, enviando | Nombre accesible; feedback sin cambiar ancho bruscamente |
| Campo | Vacío, completo, foco, error, deshabilitado | Label visible, ayuda asociada, valor preservado |
| Horario | Disponible, seleccionado, ocupado, cargando | Estado textual y selección accesible; no depender de color |
| Agenda | Carga, vacía, datos, error, desactualizada | Fecha y cancha claras; acceso alternativo a detalle |
| Diálogo | Abierto, validación, guardando, error | Foco inicial, encierro de foco cuando es modal, Escape y retorno |
| Resultado | Carga, sin resultados, éxito, error | Contador y criterios coherentes; reintento útil |
| Pago | Iniciando, pendiente, aprobado, rechazado, incierto | Sin confirmación optimista; recuperar desde estado del servidor |
| Navegación | Actual, foco, menú abierto, sesión vencida | `aria-current`, orden lógico, destino real |

Contraste: medir los pares finales, no confiar en números impresos de la referencia. Verificar texto normal, grande, controles, estados y foco conforme a WCAG 2.2 AA. Mantener errores críticos en pantalla; no hacerlos depender de un toast de cuatro segundos. Pruebas automáticas acompañadas por teclado y lector de pantalla. Zoom de 200% y reflujo equivalente a 320 px; textos largos y aumentados sin pérdida de acciones.

## 7. Protocolo de comparación visual

1. Preparar baseline por referencia: R02/R03 a 1440 × 1010, R04 a 1440 × 1400, R05/R06 a 390 × 844. El PDF puede introducir escala y saltos de página; no comparar sus márgenes de impresión con la web.
2. Capturar también 390 × 844, 768 × 1024, 1280 × 900 y pantalla completa con scroll para cada pantalla nueva. Añadir 320, 1024, 1440 y anchos entre umbrales.
3. Fijar navegador, versión, sistema de renderizado, DPR, locale `es-AR`, zona horaria, fecha/hora, datos y orden. Esperar fuentes y recursos. Desactivar animaciones en capturas. El reloj fijo de pruebas no gobierna reglas de producción.
4. Comparar superposición al 50% y diferencia de imágenes por regiones: estructura, componentes, tipografía, iconos y estados. Inspeccionar también el original.
5. Corregir primero geometría general, luego componentes, texto y detalles. No actualizar snapshots para ocultar un error.
6. Tolerancia propuesta: geometría objetivo dentro de 2 px en viewport de referencia; bordes, radios y tamaños de control según token. Diferencias por normalización se registran y pasan a baseline propio revisado.
7. Calibrar el umbral de diferencia raster con capturas repetidas del mismo entorno. No adoptar un porcentaje global que esconda errores grandes en regiones pequeñas. No enmascarar controles ni textos para hacer pasar la prueba.
8. Revisar foco, hover, selección, error, vacío, carga, modal, texto largo, importes altos, 1/5/20 canchas y disponibilidad agotada. Repetir en motores Chromium, Firefox y WebKit para comportamiento; no exigir píxeles idénticos entre motores distintos.
9. Guardar referencia, captura actual, diff y nota de excepciones junto a la evidencia de la tarea. Una suite visual exitosa no reemplaza revisión humana del diseño.

Criterio final: ninguna desviación relevante sin justificar; ninguna acción tapada; ninguna pérdida de datos por adaptación; cero scroll horizontal accidental de página; fuentes y tokens correctos; flujos utilizables con teclado y en táctil.

## 8. Paquetes pequeños de maquetación

| Paquete | Contenido | Condición para continuar |
| --- | --- | --- |
| M01 | Tipografía, colores semánticos, botones y campos | Tokens conectados y contraste comprobado |
| M02 | Tarjeta, chip, badge, horario y estados | Comparación de componentes y teclado |
| M03 | Layout jugador y admin | Navegación responsive sin contenido tapado |
| M04 | Búsqueda móvil + tablet/escritorio | R04/R05 comparadas; resultados desplazables |
| M05 | Reserva móvil + amplia | R06 comparada; selección y errores navegables |
| M06 | Agenda móvil + escritorio y detalle | R03 comparada; una cancha en móvil y foco correcto |
| M07 | Panel responsive | R02 comparada; métricas propuestas identificadas |
| M08 | Acceso, clientes, configuración, equipo y formularios | Nuevas composiciones coherentes y flujos completos |
| M09 | Mis reservas y estados de pago | Pendiente/error/éxito claramente distintos |
| M10 | Regresión de todas las pantallas | Evidencia visual y funcional por viewport |

M01–M03 corresponden a F02. M04–M09 corresponden a F03. M10 se repite sobre las pantallas afectadas durante F04–F10 y se cierra integralmente en F11. Se maqueta cada pantalla en móvil y amplio dentro del mismo paquete, evitando dejar responsive para el final.
