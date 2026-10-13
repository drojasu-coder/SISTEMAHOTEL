# Recomendaciones para Fase 4D

La Fase 4D tendrá como objetivo principal auditar pagos, Stripe, reembolsos, facturación y carritos. No debe comenzar con una implementación correctiva automática.

1. Revisar pagos y sus estados, incluyendo importes, ownership y autorización.
2. Revisar la integración Stripe, `PaymentIntent` si existe, el webhook y su firma.
3. Revisar idempotencia, operaciones repetidas y eventos Stripe duplicados.
4. Revisar reembolsos, estados parciales, importes y consistencia con el pago original.
5. Revisar carrito y `carrito-items`, incluyendo expiración, ownership, totales y relaciones con pagos.
6. Revisar facturas y `factura-items`, cálculo de importes, IVA/configuración y estados.
7. Auditar la consistencia transaccional entre pagos, Stripe, reembolsos, carritos y facturación.
8. Relacionar cada hallazgo con las pruebas PostgreSQL existentes, pruebas HTTP y pruebas de límites.
9. Añadir pruebas sólo cuando el contrato actual sea verificable, cubriendo rollback, estados parciales, reintentos y errores esperados.
10. Revisar la autorización funcional y el ownership en cada operación, sin asumir que JWT por sí solo concede acceso.

Los riesgos documentados en Fase 4C sobre actividades, mesas, parqueos, spa, amenidades, eventos y transporte permanecen como backlog y contexto de integración, pero no son el objetivo principal de Fase 4D.

La fase no debe iniciar con una refactorización global de services ni con cambios de modelos o migraciones. Las correcciones productivas, si fueran necesarias, requerirán evidencia reproducible y autorización separada.
