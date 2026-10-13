# Fase 1C — Carrito y pagos

La cobertura existente verifica ownership del pago, origen carrito-pago e índice de
idempotencia en PostgreSQL. Los fixtures ahora se eliminan por IDs propios.

Expiración de carrito, artículos, transferencias, reembolsos parciales/totales,
rollback y concurrencia de pagos permanecen pendientes. No se realizaron cobros ni
operaciones financieras reales.
