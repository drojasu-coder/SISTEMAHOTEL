# Fase 1C — Stripe

Las pruebas locales existentes verifican firma válida e inválida con secreto ficticio,
cuerpo raw y conversión de montos. No se contactó Stripe.

Replay, eventos fuera de orden, idempotencia persistida y procesamiento completo de
webhooks aún no están cubiertos. Deben probarse con eventos sintéticos y registros
aislados antes de autorizar cambios en pagos.
