# Webhook e idempotencia

## Webhook

`POST /api/pagos/stripe/webhook` se monta antes del parser JSON con raw body, no usa JWT y exige `stripe-signature`. Firma válida sólo demuestra que el evento fue autenticado; no existe registro separado de `event.id` procesado exactamente una vez.

Eventos soportados:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `refund.created`
- `refund.updated`
- `refund.failed`

Eventos desconocidos reciben `200 { received: true }` sin actualización local. Un evento conocido sin pago correspondiente produce error 404 y puede provocar retry de Stripe.

## Matriz

| Operación | Clave/constraint | Repetición observada |
|---|---|---|
| Crear pago | `idempotency_key` local + índice único | reutiliza pago; conflicto si cambian datos |
| PaymentIntent | misma clave se envía a Stripe | depende de clave proporcionada |
| Webhook PaymentIntent | no tabla de eventos; pago bloqueado por ID externo | actualización estable si el estado no retrocede de aprobado |
| Webhook refund | `id_reembolso_externo` único | busca y actualiza el reembolso |
| Factura | sin clave/constraint visible | comportamiento repetido no especificado |
| Cierre/expiración carrito | sin clave dedicada | operación basada en estado |

No se afirma idempotencia completa del webhook: falta deduplicación explícita por `event.id` y una política documentada de orden de eventos.
