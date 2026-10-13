# Insumos para Fase 5

Registrar sin limpiar todavía:

- estados duplicados y variantes (`cancelado/cancelada`, `pagado/pagada`);
- IVA `12` en migraciones, configuración y fallback;
- redondeos repetidos con `Math.round`;
- conversión GTQ/minor units;
- aliases legacy de pago;
- nombres de PaymentIntent, `id_transaccion_externo` e idempotency;
- ausencia de entidad de evento Stripe;
- URLs y ejemplos Swagger de pagos;
- código de resolutores sin tarifa para algunas referencias;
- pruebas redundantes o insuficientes de webhook/facturación;
- posible documentación antigua sobre Stripe.

No se modificaron constantes, estados, scripts ni documentación fuera de esta carpeta.
