# Fase 1B — Carrito, pagos y Stripe

Las pruebas PostgreSQL actuales verifican:

- Pago asociado a carrito.
- Ownership: otro usuario recibe `PAYMENT_NOT_FOUND`.
- Índice de idempotencia de pagos.

Resultado: **2/2 pruebas exitosas**.

Las pruebas unitarias de Stripe verifican conversión de montos, monedas inválidas,
montos no positivos, firma válida generada localmente y firma inválida. No hubo
llamadas de red ni cargos reales.

Pendiente: expiración de carrito, rollback, reembolsos persistidos, replay de eventos,
Payment Intents completos y aprobación de transferencias.
