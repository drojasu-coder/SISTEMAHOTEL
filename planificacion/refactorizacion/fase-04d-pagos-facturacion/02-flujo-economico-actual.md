# Flujo económico actual

## Flujo implementado

1. Un usuario crea/obtiene un carrito activo.
2. `carritoItem.service` valida ownership de la referencia, estado terminal, precio backend y duplicado `(carrito_id, tipo_item, referencia_id)`.
3. El pago recibe exactamente un `carrito_id` o `reserva_habitacion_id`.
4. `pago.service` valida ownership, saldo, origen abierto, monto, moneda y tipo.
5. Efectivo crea pago `aprobado` y aplica confirmación de reservas cuando corresponde.
6. Transferencia crea pago `pendiente`; un rol administrativo puede aprobarla.
7. Tarjeta crea pago `procesando`, crea PaymentIntent y guarda su ID externo.
8. Stripe llama el webhook firmado. Eventos de PaymentIntent cambian el estado local; eventos de refund crean/actualizan reembolsos.
9. Un flujo separado crea facturas, factura-items y recalcula IVA/total. No se observó creación automática de factura al aprobar pago.

## Independiente o incompleto

- No se encontró una relación directa `Factura` ↔ `Pago` o `Factura` ↔ `Carrito`.
- Facturas se crean con subtotal recibido por backend/controller y luego calculan IVA; no se derivan automáticamente de items.
- Algunos tipos de carrito tienen precio no disponible y son rechazados, aunque existan como referencias.
- `PaymentIntent` existe sólo para tarjeta; efectivo/transferencia no generan PaymentIntent.
