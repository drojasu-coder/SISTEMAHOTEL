# Riesgos y brechas

1. No existe deduplicación explícita por ID de evento Stripe.
2. No hay prueba PostgreSQL de webhooks, reembolsos o factura-items.
3. Facturas y pagos son flujos independientes.
4. El ownership de facturas requiere revisión HTTP específica.
5. La consistencia de IVA depende del módulo configuraciones coordinado por Diego.
6. `number` y redondeo decimal se usan junto con columnas DECIMAL.
7. La integración externa dentro de transacciones puede dejar estados divergentes.
8. Carritos con referencias de mesa, actividad y amenidad no tienen precio implementado.
9. No se observó una regla de factura única por pago/carrito.
10. Estados locales y Stripe pueden recibir eventos fuera de orden.

Las reglas no especificadas se marcan `REQUIERE_CONFIRMACION_NEGOCIO`, no se convierten en correcciones automáticas.
