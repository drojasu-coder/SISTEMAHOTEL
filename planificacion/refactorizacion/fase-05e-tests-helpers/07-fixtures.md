# Fixtures

Las fixtures son locales a cada riesgo:

- auth: usuario creado vía endpoint;
- pagos: dos usuarios, carrito y pago persistido;
- reservas: sucursal, habitación, mesa, recurso, instructor y usuario;
- sucursales: sucursal, tipo de habitación y habitación;
- HTTP: payloads mínimos para cada contrato.

Aunque hay nombres y datos de dominio repetidos, no existe una factory común
inequívoca que mejore legibilidad sin ocultar relaciones necesarias. Se
conservaron fixtures explícitas.
