# Pagos y estados

## Estados observados

| Estado | Origen/uso |
|---|---|
| `pendiente` | transferencia recién creada y default de modelo |
| `procesando` | pago con tarjeta antes de webhook |
| `aprobado` | efectivo, transferencia aprobada o PaymentIntent succeeded |
| `rechazado` | PaymentIntent payment_failed |
| `cancelado` | PaymentIntent canceled |
| `reembolsado_parcial` | reembolsos aprobados menores al pago |
| `reembolsado` | reembolsos aprobados cubren el pago |

El estado local no es el estado Stripe: el primero cambia sólo al procesar eventos o aprobar transferencia. La creación de tarjeta devuelve `client_secret`; no marca aprobado antes del webhook.

El servicio bloquea pagos/orígenes durante cálculos y usa idempotency key local si se proporciona. El índice PostgreSQL es único para claves no nulas.
