# Estados y constantes

## Familias observadas

- roles: `cliente`, `admin` y constantes en `src/constants/roles.ts`;
- pagos: `pendiente`, `procesando`, `aprobado`, `rechazado`, `cancelado`,
  `reembolsado_parcial`, `reembolsado`;
- carrito: `activo`, `expirado`;
- facturas: estados de factura en modelo/servicio;
- reservas: disponibles, reservadas, canceladas y estados por dominio;
- habitaciones, recursos, parqueos y transporte: estados específicos.

La repetición entre modelos, validators, servicios y tests es candidata a
5D. No se consolidó porque una variante puede ser contrato o regla de negocio.
La fuente debe ser inventariada antes de cambiar strings.
