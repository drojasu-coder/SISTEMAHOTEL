# 5. Dominios y límites

## Dominios propuestos

1. **Identidad:** auth, usuarios, roles y JWT.
2. **Hospedaje:** tipos de habitación, habitaciones, parqueos y reservas de habitación/parqueo.
3. **Experiencias:** eventos, actividades, amenidades, bienestar y restaurante.
4. **Operaciones:** transporte, personal, proveedores y sucursales.
5. **Comercial:** carritos, promociones y facturación.
6. **Pagos:** pagos, Stripe, transferencias y reembolsos.
7. **Plataforma:** configuración, seguridad, errores, observabilidad y documentación.

## Límites importantes

Reservas son dueñas de disponibilidad y estados de reserva. Carritos agregan productos/orígenes y no deben duplicar reglas de disponibilidad. Pagos verifica importes y confirma efectos mediante transacciones; no debe convertirse en dueño de cada dominio. Facturación consume resultados confirmados y no debe alterar concurrencia de reservas.

## Dependencias recomendadas

Identidad puede ser transversal para autorización. Pagos puede consumir contratos de carrito/reserva. Comercial puede referenciar catálogos, pero los catálogos no deben depender de pagos. Plataforma no debe importar casos de uso de negocio.

Estas son reglas objetivo, no cambios ya aplicados.

