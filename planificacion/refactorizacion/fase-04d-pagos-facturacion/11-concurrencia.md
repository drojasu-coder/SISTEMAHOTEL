# Concurrencia económica

## Protecciones observadas

- Creación de carrito bloquea usuario para impedir dos carritos activos.
- Items bloquean carrito y rechazan duplicados mediante consulta serializada.
- Pagos bloquean origen, pagos y reembolsos durante cálculo de saldo.
- Aprobación de transferencia bloquea el pago.
- Reembolsos bloquean pago antes de calcular saldo.
- Webhook bloquea pago antes de actualizar estado.

## Riesgos

- Crear factura-item y recalcular factura son dos operaciones separadas.
- Dos modificaciones de items pueden recalcular sobre lecturas intercaladas.
- Reintentos de webhook están protegidos por identificador de refund, pero no por `event.id`.
- PaymentIntent/refund externo y commit local no comparten transacción distribuida.
- Expiración de carrito y modificación de item tienen una fase previa fuera de la transacción.

No se añadió una prueba de carrera que dependa de una regla no especificada.
