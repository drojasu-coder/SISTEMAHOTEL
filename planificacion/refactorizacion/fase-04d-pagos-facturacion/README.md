# Fase 4D — Pagos, Stripe, reembolsos, facturación y carritos

Auditoría del flujo económico implementado en el baseline `f5ae3d2`. Esta fase no modifica código productivo, modelos, migraciones, dependencias, contratos HTTP ni la arquitectura de configuraciones/IVA.

## Resultado ejecutivo

- El carrito y sus items tienen ownership, resolución de referencias y precios calculados en backend.
- Los pagos aceptan carrito o reserva de habitación, pero no ambos; efectivo se aprueba localmente, transferencia queda pendiente y tarjeta crea un PaymentIntent.
- Stripe se usa mediante `PaymentIntent`, refunds y webhook firmado con raw body.
- El webhook valida autenticidad, pero no existe una tabla de eventos Stripe procesados; la deduplicación observada depende de identificadores externos de pagos/reembolsos.
- Reembolsos y pagos usan transacciones y locks; facturas e items realizan varias escrituras sin transacción conjunta.
- Facturación consulta IVA del módulo coordinado por Diego, pero es un flujo independiente de pagos/carritos.
- No se añadieron pruebas nuevas: las pruebas actuales son deterministas y las brechas restantes requieren contratos o fixtures adicionales.

José continúa pausado. `f5ae3d2` es baseline histórico, no su base definitiva futura.
