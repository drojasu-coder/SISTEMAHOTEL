# Matriz transaccional

| Operación | Tablas afectadas | Transacción | Lock | Riesgo parcial | Severidad |
|---|---|---:|---:|---|---|
| Crear carrito | usuario, carrito | Sí | usuario UPDATE | bajo | medio |
| Crear/eliminar item | carrito, item, referencia leída | Sí | carrito UPDATE | bajo | medio |
| Crear pago efectivo/transferencia | pago, origen/reserva | Sí | origen/pago | medio | alto |
| Crear pago tarjeta | pago + Stripe externo | PostgreSQL sí; externo fuera | origen | Stripe aceptado y DB fallida | crítico |
| Webhook PaymentIntent | pago y potencial reserva/carrito | Sí | pago UPDATE | bajo dentro de DB | alto |
| Webhook refund | reembolso + pago | Sí | pago/refunds | bajo dentro de DB | alto |
| Aprobar transferencia | pago + origen | Sí | pago | bajo | alto |
| Crear reembolso | refund + pago | Sí; Stripe externo dentro | pago | externo/local desalineados | crítico |
| Crear factura | usuario + factura | No | no | una fila | medio |
| Crear factura-item | factura-item + factura recalculada | No | no | item creado sin recálculo | alto |
| Mover factura-item | item + dos facturas | No | no | una factura actualizada y otra no | alto |

No se añadieron transacciones por uniformidad; las correcciones requieren decisión sobre límites de integración externa y contratos.
