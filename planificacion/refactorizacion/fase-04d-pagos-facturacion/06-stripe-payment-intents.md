# Stripe y PaymentIntent

`stripe.service.ts` inicializa el cliente lazily desde configuración. Fuera de producción exige una clave `sk_test_`; nunca se utilizó una clave real en esta fase.

Para tarjeta, `createPago`:

- crea pago local `procesando`;
- crea PaymentIntent con monto GTQ en minor units;
- envía metadata `pago_id`, origen y tipo;
- guarda `id_transaccion_externo`;
- devuelve ID y `client_secret`.

La idempotency key se envía a Stripe cuando existe y también se guarda localmente. Repetir la creación local con la misma clave devuelve el pago existente y recupera el PaymentIntent si es tarjeta.

El webhook verifica que PaymentIntent, monto, moneda y metadata correspondan al pago local. Riesgos pendientes: operación externa Stripe dentro de una transacción PostgreSQL, pérdida de sincronización si Stripe acepta y la transacción local falla, y comportamiento ante reintentos sin clave.
