# Stripe

`stripe.service.test.ts` cubre:

- conversión GTQ a minor units;
- rechazo de moneda no soportada;
- rechazo de montos no positivos;
- verificación de firma válida sin red;
- rechazo de firma inválida.

Usa `STRIPE_WEBHOOK_SECRET` sintético del setup y respeta la moneda
`PAYMENT_CURRENCY` introducida en Fase 5D por comportamiento equivalente.
No se añadieron pruebas redundantes.
