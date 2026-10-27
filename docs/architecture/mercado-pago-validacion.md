# F00.3 — Validación preliminar de Mercado Pago

Fecha: 24 de octubre de 2026. Estado: revisión documental realizada; OAuth y cobros de prueba NO ejecutados. Valen confirmó que todavía no tiene preparada la aplicación ni las cuentas de prueba.

## Conclusión limitada a la documentación

La documentación oficial contempla Checkout Pro con token OAuth de cada vendedor. Es una vía candidata coherente con que cada complejo reciba sus propias señas. Esto no demuestra todavía que la aplicación concreta del proyecto esté habilitada, que los callbacks funcionen ni que dos vendedores puedan cobrar correctamente en su configuración. [Integración en marketplace](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-payments/how-tos/integrate-marketplace?scope=prod).

La guía de configuración indica aplicación de pagos online, producto compatible y modelo Marketplace, además de URL de redirección. No se creó ninguna aplicación externa durante F00. [Configuración](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/create-configuration).

## Contrato candidato que se debe probar

Checkout Pro vía **Preferences API**, con `/checkout/preferences` y credenciales OAuth del vendedor, es el contrato descrito en la guía de marketplace consultada. La documentación también ofrece Checkout Pro vía Orders API: no mezclar el ejemplo `/v1/orders` y sus tópicos con Preferences sin comprobar compatibilidad del producto elegido. Registrar la familia API seleccionada en la evidencia de prueba. [Guía de marketplace](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-payments/how-tos/integrate-marketplace?scope=prod), [documentación Preferences](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/integration-test/test-purchases).

No incorporar comisión de Turnero por reserva ni `marketplace_fee` comercial por inferencia. Validar la configuración sin comisión de plataforma para este SaaS y documentar cualquier requisito del proveedor. La suscripción a Turnero continúa separada.

OAuth Authorization Code permite autorización del vendedor; la guía incluye `state`, PKCE y canje en servidor, y describe `test_token` para pruebas. La implementación deberá validar sesión propietaria, complejo, state de un uso y redirect permitido; nunca enlazar cuentas usando un `complex_id` arbitrario del callback. [OAuth](https://www.mercadopago.com.ar/developers/es/docs/security/oauth/creation).

La recepción de Webhooks debe validar la firma según el contrato seleccionado y luego consultar el recurso al proveedor. El secreto configurado no es el contenido de `x-signature`: esa cabecera aporta datos para verificar la firma. Guardar durablemente el evento antes de acusar recibo exitoso si el procesamiento será diferido. [Webhooks Preferences](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-content/notifications/webhooks).

## Prerrequisitos pendientes

| Recurso | Responsable | Estado |
| --- | --- | --- |
| Aplicación de integración en cuenta del proyecto, producto/modelo correctos | Valen con asistencia técnica | No preparada según respuesta |
| Dos vendedores de prueba A/B y comprador de prueba en Argentina | Valen con asistencia técnica | No preparados |
| Credenciales de prueba de aplicación y vendedores | Configuración local segura | No disponibles para esta ejecución; no copiarlas a documentación/chat |
| Callback OAuth y Webhook HTTPS registrados | Implementación técnica | Pendiente; no hay aplicación inicializada |
| Secretos de firma y almacenamiento protegido | Implementación técnica | Pendiente |
| Registro de intento y receptor esperado | Implementación técnica | Pendiente |

No identificar un entorno solo por el prefijo de un token; comprobar configuración y cuenta de prueba. La documentación distingue comprador, vendedor e integrador y requiere país compatible. [Cuentas de prueba](https://www.mercadopago.com.ar/developers/en/docs/checkout-pro-orders/resources/your-integrations/test/accounts?scope=prod). Esta fuente sirve para inventario de cuentas; no prescribe cambiar el contrato de checkout a Orders.

## Guion de prueba para cerrar F00.3

Preparar una comprobación mínima aislada cuando existan recursos; no implementar todo F09 para probar viabilidad. Si requiere infraestructura de F01, mantener este punto pendiente hasta entonces.

| Caso | Acción | Evidencia esperada | Ejecutado |
| --- | --- | --- | --- |
| MP01 | Vendedor A autoriza con OAuth | Cuenta receptora A asociada al complejo A; secretos no expuestos | No |
| MP02 | Vendedor B autoriza | Asociación independiente B, sin reemplazar A | No |
| MP03 | Reutilizar state/código o alterar contexto | Rechazo, sin nueva asociación | No |
| MP04 | Crear checkout de prueba para A con token de A | Preferencia/intento y receptor correctos; moneda ARS | No |
| MP05 | Comprador de prueba completa pago A | Pago consultado y aprobado en cuenta A; ningún efecto B | No |
| MP06 | Repetir checkout/pago para B | Cobro receptor B; independencia comprobada | No |
| MP07 | Recibir Webhook, repetirlo y falsificar firma | Auténtico verificable, duplicado idempotente, falso rechazado | No |
| MP08 | Alterar parámetros del retorno | No confirmar por retorno; consultar proveedor | No |
| MP09 | Ensayar refresh/revocación según soporte de prueba | Renovación segura o error recuperable, sin filtrar tokens | No |

La evidencia debe contener fecha, ambiente, familia de API, IDs técnicos de prueba y resultados redactados; no tokens, códigos OAuth, datos sensibles ni contraseñas. Si una función no puede simularse, anotarlo como limitación, no como prueba pasada.

## Bloqueos e impacto

F00.3 no está cerrada por ausencia confirmada de aplicación/cuentas y de endpoint de prueba. No hay indicios documentales que obliguen a cambiar de proveedor en este momento. F01/F02 pueden avanzar; no afirmar integración validada ni habilitar pagos reales hasta completar el guion y F09. Las políticas D08/D09 siguen siendo necesarias para decidir qué hace la reserva ante cada resultado financiero.
