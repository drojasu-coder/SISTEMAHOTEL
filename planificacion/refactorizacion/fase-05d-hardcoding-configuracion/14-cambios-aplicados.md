# Cambios aplicados

Se añadió `backend/src/constants/payments.ts` con:

- `PAYMENT_METHODS`;
- `PAYMENT_TYPES`;
- `PAYMENT_CURRENCY`;
- tipos derivados `PaymentMethod` y `PaymentType`.

Se actualizaron el validator de pagos, `pago.service.ts` y
`stripe.service.ts` para reutilizar esas fuentes.

El comportamiento observable se conserva: los mismos métodos, tipos, moneda,
errores y conversiones de Stripe.
