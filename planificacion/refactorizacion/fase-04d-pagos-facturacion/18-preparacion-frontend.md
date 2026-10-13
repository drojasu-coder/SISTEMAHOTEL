# Preparación para frontend

## Estable o relativamente estable

- Carrito exige usuario autenticado y devuelve estado/expiración.
- Item devuelve precio y descripción resueltos por backend.
- Pago tarjeta devuelve `pago_id`, PaymentIntent, `client_secret`, estado, monto y moneda.
- Webhook no es una operación de frontend y no debe exponerse como confirmación directa.

## Parcial o ambiguo

- Estados de pago y transición visible para UI.
- Facturación no enlazada claramente a pago/carrito.
- Reembolsos y su efecto sobre factura.
- Items cuyo precio no existe.
- Errores de repetición/idempotencia.

Frontend necesitará contratos explícitos para polling de PaymentIntent, estados terminales, errores, facturas, reembolsos y ownership. No se implementó frontend ni se introdujeron contratos nuevos.
