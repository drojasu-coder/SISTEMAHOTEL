# Tablas y relaciones de la base de datos

El proyecto utiliza **39 tablas en total**:

- **38 tablas funcionales** del sistema hotelero.
- **1 tabla técnica** (`SequelizeMeta`), creada por Sequelize para registrar las migraciones ejecutadas.

## Lista de tablas

### Tablas funcionales

| # | Tabla | Descripción |
|---:|---|---|
| 1 | `usuarios` | Clientes, administradores y demás usuarios del sistema. |
| 2 | `sucursales` | Sedes del hotel. |
| 3 | `tipos_habitacion` | Catálogo de tipos, capacidad y tarifa de habitaciones. |
| 4 | `habitaciones` | Habitaciones pertenecientes a una sucursal y a un tipo. |
| 5 | `reservas_habitacion` | Reservas de habitaciones realizadas por usuarios. |
| 6 | `parqueos` | Espacios de parqueo de cada sucursal. |
| 7 | `reservas_parqueo` | Reservas de espacios de parqueo. |
| 8 | `pagos` | Pagos de reservas de habitación o de carritos. |
| 9 | `salones` | Salones disponibles para eventos por sucursal. |
| 10 | `servicios_evento` | Servicios adicionales para eventos. |
| 11 | `reservas_evento` | Reservas de salones para eventos. |
| 12 | `reserva_evento_servicios` | Servicios incluidos en una reserva de evento. |
| 13 | `mesas` | Mesas del restaurante por sucursal. |
| 14 | `reservas_mesa` | Reservas de mesas realizadas por usuarios. |
| 15 | `instructores` | Instructores de actividades recreativas. |
| 16 | `recursos_actividad` | Canchas, mesas u otros recursos para actividades. |
| 17 | `reservas_actividad` | Reservas de recursos recreativos. |
| 18 | `amenidades` | Amenidades disponibles por sucursal. |
| 19 | `reservas_amenidad` | Reservas de amenidades. |
| 20 | `terapeutas` | Terapeutas del área de bienestar. |
| 21 | `servicios_bienestar` | Servicios de spa y bienestar. |
| 22 | `citas_bienestar` | Citas de bienestar reservadas por usuarios. |
| 23 | `boletos_parque` | Boletos para el parque temático. |
| 24 | `choferes` | Conductores disponibles para transporte. |
| 25 | `vehiculos` | Vehículos disponibles para transporte. |
| 26 | `reservas_transporte` | Reservas de transporte. |
| 27 | `carritos` | Carritos de compra de los usuarios. |
| 28 | `carrito_items` | Artículos incluidos en un carrito. |
| 29 | `promociones` | Promociones y descuentos aplicables. |
| 30 | `configuraciones` | Configuración general, como el porcentaje de IVA. |
| 31 | `facturas` | Facturas emitidas a los usuarios. |
| 32 | `factura_items` | Detalle de productos o servicios de una factura. |
| 33 | `empleados` | Empleados asociados a usuarios y sucursales. |
| 34 | `turnos` | Turnos asignados a empleados. |
| 35 | `proveedores` | Proveedores del hotel. |
| 36 | `proveedor_productos` | Productos ofrecidos por proveedores. |
| 37 | `cuentas_por_pagar` | Obligaciones pendientes con proveedores. |
| 38 | `reembolsos` | Reembolsos asociados a pagos. |

### Tabla técnica

| # | Tabla | Descripción |
|---:|---|---|
| 39 | `SequelizeMeta` | Registro interno de las migraciones ejecutadas por Sequelize. No tiene relaciones funcionales con las demás tablas. |

## Relaciones

Las relaciones se expresan como `tabla_hija.columna_fk -> tabla_padre.id`.

### Sucursales

- `habitaciones.sucursal_id -> sucursales.id`
- `parqueos.sucursal_id -> sucursales.id`
- `salones.sucursal_id -> sucursales.id`
- `mesas.sucursal_id -> sucursales.id`
- `recursos_actividad.sucursal_id -> sucursales.id`
- `amenidades.sucursal_id -> sucursales.id`
- `empleados.sucursal_id -> sucursales.id`

### Usuarios

- `reservas_habitacion.usuario_id -> usuarios.id`
- `reservas_evento.usuario_id -> usuarios.id`
- `reservas_mesa.usuario_id -> usuarios.id`
- `reservas_actividad.usuario_id -> usuarios.id`
- `reservas_amenidad.usuario_id -> usuarios.id`
- `boletos_parque.usuario_id -> usuarios.id`
- `reservas_transporte.usuario_id -> usuarios.id`
- `carritos.usuario_id -> usuarios.id`
- `facturas.usuario_id -> usuarios.id`
- `empleados.usuario_id -> usuarios.id` (relación uno a uno)

### Habitaciones y parqueo

- `habitaciones.tipo_habitacion_id -> tipos_habitacion.id`
- `reservas_habitacion.habitacion_id -> habitaciones.id`
- `reservas_parqueo.reserva_habitacion_id -> reservas_habitacion.id`
- `reservas_parqueo.parqueo_id -> parqueos.id`
- `pagos.reserva_habitacion_id -> reservas_habitacion.id`

### Eventos

- `reservas_evento.salon_id -> salones.id`
- `reserva_evento_servicios.reserva_evento_id -> reservas_evento.id`
- `reserva_evento_servicios.servicio_evento_id -> servicios_evento.id`

### Restaurante y actividades

- `reservas_mesa.mesa_id -> mesas.id`
- `reservas_actividad.recurso_id -> recursos_actividad.id`
- `reservas_actividad.instructor_id -> instructores.id`

### Amenidades y bienestar

- `reservas_amenidad.amenidad_id -> amenidades.id`
- `citas_bienestar.servicio_bienestar_id -> servicios_bienestar.id`
- `citas_bienestar.terapeuta_id -> terapeutas.id`

### Transporte

- `reservas_transporte.chofer_id -> choferes.id`
- `reservas_transporte.vehiculo_id -> vehiculos.id`

### Carrito, promociones y pagos

- `carrito_items.carrito_id -> carritos.id`
- `carrito_items.promocion_id -> promociones.id`
- `pagos.carrito_id -> carritos.id`
- `reembolsos.pago_id -> pagos.id`

### Facturación, personal y proveedores

- `factura_items.factura_id -> facturas.id`
- `turnos.empleado_id -> empleados.id`
- `proveedor_productos.proveedor_id -> proveedores.id`
- `cuentas_por_pagar.proveedor_id -> proveedores.id`

## Observaciones

- `carrito_items.referencia_id` es una referencia polimórfica: su tabla destino depende del valor de `tipo_item`, por lo que no tiene una clave foránea SQL única.
- `configuraciones` no tiene claves foráneas.
- `SequelizeMeta` es una tabla interna de migraciones y no forma parte del modelo funcional del hotel.
- La definición detallada de columnas se encuentra en [`backend/dbml.txt`](backend/dbml.txt).
