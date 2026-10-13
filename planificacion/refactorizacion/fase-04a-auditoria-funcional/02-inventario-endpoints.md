# Inventario de endpoints

El inventario se derivó de `backend/src/routes/**/*.ts` y de los montajes efectivos en `backend/src/app.ts`; no se contó únicamente Swagger. Hay 38 routers y 182 declaraciones `router.get/post/put/patch/delete`.

| Dominio / prefijo | Router | Operaciones | Forma |
|---|---|---:|---|
| auth `/api/auth` | `auth.routes.ts` | 3 | register, login, me |
| eventos `/api/servicios-evento` | `servicioEvento.routes.ts` | 5 | CRUD |
| habitaciones `/api/habitaciones` | `habitacion.routes.ts` | 5 | CRUD |
| habitaciones `/api/tipos-habitacion` | `tipoHabitacion.routes.ts` | 5 | CRUD |
| habitaciones `/api/parqueos` | `parqueo.routes.ts` | 5 | CRUD |
| reservas `/api/reservas-habitacion` | `reservaHabitacion.routes.ts` | 5 | consulta, creación, actualización, eliminación |
| reservas `/api/reservas-parqueo` | `reservaParqueo.routes.ts` | 5 | consulta, creación, actualización, eliminación |
| comercio `/api/promociones` | `promocion.routes.ts` | 5 | CRUD |
| facturación `/api/facturas` | `factura.routes.ts` | 5 | CRUD |
| facturación `/api/factura-items` | `facturaItem.routes.ts` | 5 | CRUD |
| administración `/api/configuraciones` | `configuracion.routes.ts` | 2 | IVA GET/PATCH |
| proveedores `/api/proveedores` | `proveedor.routes.ts` | 5 | CRUD |
| proveedores `/api/proveedor-productos` | `proveedorProducto.routes.ts` | 5 | CRUD |
| proveedores `/api/cuentas-por-pagar` | `cuentaPorPagar.routes.ts` | 5 | CRUD |
| pagos `/api/pagos` | `pago.routes.ts` | 6 | pago, listado, resumen, transferencia, detalle, reembolso |
| eventos `/api/salones` | `salon.routes.ts` | 5 | CRUD |
| usuarios `/api/usuarios` | `usuario.routes.ts` | 6 | listado, detalle, creación, edición, rol, estado |
| reservas `/api/reservas-evento` | `reservaEvento.routes.ts` | 5 | consulta, creación, actualización, cancelación |
| personal `/api/empleados` | `empleado.route.ts` | 5 | CRUD |
| personal `/api/turnos` | `turno.routes.ts` | 5 | CRUD |
| transporte `/api/choferes` | `chofer.routes.ts` | 5 | CRUD y estado |
| transporte `/api/vehiculos` | `vehiculo.routes.ts` | 5 | CRUD |
| reservas `/api/reservas-transporte` | `reservaTransporte.routes.ts` | 6 | consulta, creación, actualización, cancelar, asignar |
| administración `/api/sucursales` | `sucursal.routes.ts` | 5 | CRUD |
| restaurante `/api/mesas` | `mesa.routes.ts` | 5 | CRUD |
| actividades `/api/recursos-actividad` | `recursoActividad.routes.ts` | 5 | CRUD |
| actividades `/api/instructores` | `instructor.routes.ts` | 5 | CRUD |
| reservas `/api/reservas-actividad` | `reservaActividad.routes.ts` | 4 | crear, consultar, estado |
| amenidades `/api/amenidades` | `amenidad.routes.ts` | 5 | CRUD |
| reservas `/api/reservas-amenidad` | `reservaAmenidad.routes.ts` | 4 | crear, consultar, estado |
| bienestar `/api/terapeutas` | `terapeuta.routes.ts` | 5 | CRUD |
| bienestar `/api/servicios-spa` | `servicioSpa.routes.ts` | 5 | CRUD |
| bienestar `/api/citas-spa` | `citaSpa.routes.ts` | 4 | crear, consultar, estado |
| parque `/api/boletos-parque` | `boletoParque.routes.ts` | 5 | crear, consultar, estado, eliminar |
| reservas `/api/reservas-mesa` | `reservaMesa.routes.ts` | 4 | crear, consultar, estado |
| carritos `/api/carritos` | `carrito.routes.ts` | 4 | listado, actual, detalle, crear |
| carritos `/api/carritos/:carritoId/items` | `carritoItem.routes.ts` | 4 | listado, detalle, crear, eliminar |

Total de routers: 38. Total de declaraciones de router: 182. `app.ts` añade `GET /api/health` y `POST /api/pagos/stripe/webhook`, total efectivo 184 operaciones. `PUT` no aparece en los routers.
