# Autorización funcional

La autenticación JWT es transversal, pero no equivale a autorización sobre una reserva.

## Evidencia favorable

- Eventos filtra listados por `usuario_id` salvo ADMIN y valida propietario/ADMIN en detalle y servicios asociados.
- Transporte aplica la misma regla en consultas y actualizaciones.
- Habitaciones recibe contexto de solicitante en operaciones principales y distingue roles administrativos.
- Amenidades restringe creación a CLIENTE y administración/listado/estado a ADMIN.
- Mesas, actividades, parqueos y spa declaran roles en routers, pero varios services no reciben requester; el router es la barrera principal.

## Riesgos

- Cualquier cambio de router que relaje `requireRole` puede exponer services que no realizan ownership.
- Debe comprobarse si roles administrativos distintos de ADMIN deben consultar o modificar reservas.
- La relación entre reserva y sucursal no se usa como autorización transversal en todos los dominios.
- Los endpoints anidados de carrito/pago tienen reglas propias y no se consideran parte de esta auditoría salvo su relación con reservas.

Conclusión: no se modificó autorización. Los casos entre usuarios, roles y sucursales quedan como pruebas HTTP/PG de una fase posterior cuando exista matriz de permisos aprobada.
