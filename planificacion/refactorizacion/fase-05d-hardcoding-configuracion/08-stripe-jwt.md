# Stripe y JWT

Los secretos Stripe y JWT ya provienen de `env.ts`; no se imprimieron ni se
incluyeron en documentación. Se conservaron sus validaciones y defaults.

Stripe mantiene moneda, conversión a minor units, eventos, metadata y
webhooks. La única modificación fue reutilizar `PAYMENT_CURRENCY` para la
moneda de dominio existente.

No se llamó a Stripe real ni se cambió la expiración o validación de tokens.
