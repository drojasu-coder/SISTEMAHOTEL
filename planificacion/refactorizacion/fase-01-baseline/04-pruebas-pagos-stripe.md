# 04 — Pruebas de pagos y Stripe

## Implementadas y ejecutadas

- Conversión GTQ a unidades menores.
- Rechazo de moneda no soportada.
- Rechazo de monto no positivo.
- Rechazo de más de dos decimales en validator.
- Restricción de resumen a un único origen.
- Reconocimiento de roles administrativos de pagos.
- Denegación de ownership de carrito ajeno.
- Webhook sin firma/raw válido devuelve 400 sin JWT.

Resultado: **8 casos, 8 exitosos** (incluye casos unitarios y HTTP).

## No ejecutado

No se crearon pagos, Payment Intents, reembolsos ni transacciones. No se llamó a Stripe productivo ni de prueba. No se validó una firma criptográfica válida ni replay contra persistencia.

## Protección preservada

El orden actual `express.raw` para webhook antes de `express.json` no fue modificado. La prueba confirma el rechazo temprano de una solicitud sin firma, pero no sustituye la prueba de firma válida sobre bytes exactos.
