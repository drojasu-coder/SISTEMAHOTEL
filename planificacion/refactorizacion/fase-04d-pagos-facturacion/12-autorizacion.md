# Autorización y ownership

El middleware JWT autentica rutas económicas. `paymentOwnership` permite al propietario de carrito/reserva y a roles administrativos definidos acceder según operación. Las pruebas existentes verifican que otro cliente no vea un pago vinculado a carrito ajeno.

Pagos, reembolsos y carritos aplican verificaciones en services además de routers. Facturas y factura-items deben revisarse con especial cuidado: los services mostrados no reciben requester, por lo que la protección depende de las rutas y puede no representar ownership por usuario.

Debe auditarse:

- lectura y modificación de carritos;
- creación y consulta de pagos;
- aprobación de transferencias;
- reembolso;
- creación/consulta de facturas;
- acceso por IDs manipulados;
- ADMIN y roles administrativos;
- relación de sucursal.

No se cambió autorización. Un JWT válido no se considera autorización universal.
