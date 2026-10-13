# Pruebas agregadas

No se añadieron pruebas en esta fase porque las pruebas nuevas posibles cruzaban una de estas limitaciones:

- requerían Stripe externo;
- requerían fixtures de factura/carrito no existentes;
- congelaban una política de facturación o reembolso no documentada;
- necesitaban decidir si un evento Stripe desconocido o repetido debe ser 200, ignorado o reprocesado.

Pruebas existentes relevantes:

- `tests/integration/postgres.payments.test.ts`: ownership de pago y constraint de idempotency key.
- `tests/unit/stripe.service.test.ts`: conversión de moneda, montos y firma.
- `tests/unit/payment-ownership.test.ts`: política de ownership/roles.
- `tests/integration/app.http.test.ts`: webhook fuera de JWT y raw body.
- `tests/unit/reservation-payment.validators.test.ts`: validadores de pagos.

Pendientes de bajo riesgo: webhook duplicado con mismo refund ID, estados de PaymentIntent y reembolso con mocks controlados, y rollback de factura-item en PostgreSQL aislado.
