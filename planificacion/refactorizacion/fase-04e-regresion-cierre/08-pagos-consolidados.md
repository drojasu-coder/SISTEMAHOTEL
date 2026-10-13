# Pagos consolidados

El flujo actual es carrito → item → pago, con PaymentIntent para tarjeta,
webhook firmado, reembolsos transaccionales y facturación separada.

| Hallazgo Fase 4D | Clasificación actual |
|---|---|
| Sin deduplicación explícita por `Stripe event.id` | riesgo técnico/decisión |
| Relación Factura-Pago/Carrito no definida | regla ambigua/decisión |
| Stripe externo frente a commit PostgreSQL | riesgo técnico |
| Atomicidad de factura-items | riesgo técnico |
| Ownership de facturación | falta de evidencia |
| Estados e idempotencia | contrato/decisión |
| Reglas de reembolso | regla de negocio pendiente |

La autenticidad de webhook no equivale a idempotencia. Ningún punto se
implementa automáticamente en esta fase.
