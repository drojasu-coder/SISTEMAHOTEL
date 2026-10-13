# Protección de Stripe

`POST /api/pagos/stripe/webhook` mantiene:

- `express.raw` antes de `express.json`.
- Verificación de `Stripe-Signature`.
- Ausencia de JWT.
- CORS para solicitudes sin Origin.
- Limite independiente `WEBHOOK_BODY_LIMIT` (512 KB por defecto).

No se realizan cobros reales ni se desactiva la firma. El rate limiter de
autenticacion no aplica a este endpoint.
