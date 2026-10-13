# Inventario de dominios

| Dominio | Operaciones observadas | Reglas comprobables | Evidencia actual |
|---|---|---|---|
| Habitaciones | crear, consultar, actualizar, cancelar | referencias, capacidad, mantenimiento, fechas, solapamiento, estados bloqueantes | código y pruebas PostgreSQL; concurrencia cubierta |
| Eventos | CRUD/estado de `ReservaEvento` | salón, sucursal activa, capacidad, rango, cotización/confirmada, propietario/ADMIN | código; sin prueba específica del dominio |
| Servicios de evento | listar, obtener, agregar, modificar, eliminar | reserva propietaria/ADMIN, estado cotización, servicio existente, recálculo de montos | código; sin prueba específica |
| Amenidades | crear, listar/obtener ADMIN, cambiar estado | fecha/franja, aforo, solapamiento del usuario, amenidad existente, cliente/ADMIN | código; sin prueba PostgreSQL específica |
| Actividades | crear, listar, obtener, actualizar | recurso, instructor activo, fecha, duración 30–120 min, solapamiento | código y prueba de solapamiento; sin concurrencia |
| Mesas | crear, listar, obtener, estado | mesa, capacidad, fecha/hora, misma franja, mantenimiento | código y prueba de conflicto; sin concurrencia |
| Parqueos | crear, actualizar, eliminar | parqueo, fechas, mantenimiento, intervalos abiertos/cerrados | código; sin prueba específica |
| Spa/bienestar | crear, listar, obtener, cambiar estado | terapeuta activo, servicio, duración, buffer de 15 min | código; sin prueba específica |
| Transporte | crear, actualizar, reintentar, cancelar, consultar | fecha futura, ruta distinta, capacidad, chofer/vehículo, ventana de bloqueo, propietario/ADMIN | código; sin prueba específica |

No se dedujeron reglas de negocio para relaciones entre sucursales, recursos auxiliares o número de personas cuando el código no las declara.
