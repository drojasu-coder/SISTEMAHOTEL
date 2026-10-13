# Matriz de invariantes

| ID | Dominio | Invariante observada | Estado | Evidencia/riesgo |
|---|---|---|---|---|
| HAB-01 | Habitaciones | entrada y salida deben estar ordenadas | comprobada mediante código y prueba | `reservaHabitacion.service.ts`, prueba de reservas |
| HAB-02 | Habitaciones | reservas `pendiente` y `confirmada` bloquean; cancelada/finalizada/expirada no | comprobada mediante código y prueba | conjunto explícito y pruebas de cancelación |
| HAB-03 | Habitaciones | no exceder capacidad ni reservar habitación en mantenimiento | implementada pero sin prueba suficiente | código; falta prueba dedicada |
| HAB-04 | Habitaciones | carrera de doble reserva deja un único éxito | comprobada mediante prueba | lock de habitación y transacción |
| EVT-01 | Eventos | salón existente y sucursal activa | implementada pero sin prueba suficiente | lock de salón; falta prueba de dominio |
| EVT-02 | Eventos | rangos solapados en estados cotización/confirmada conflictúan | implementada pero sin prueba suficiente | transacción; falta prueba HTTP/PG |
| EVT-03 | Eventos | modificación de servicios sólo en cotización | implementada pero sin prueba suficiente | service y prueba pendiente |
| AME-01 | Amenidades | fecha/franja válida y no pasada | implementada pero sin prueba suficiente | validadores/service; zona configurada |
| AME-02 | Amenidades | aforo concurrente no excedido | implementada pero sin prueba suficiente | lock de amenidad; falta fixture de PG |
| AME-03 | Amenidades | cliente no duplica franja superpuesta | implementada pero sin prueba suficiente | service; autorización de route |
| ACT-01 | Actividades | recurso/instructor y ventana 30–120 minutos | comprobada parcialmente | prueba cubre solapamiento, no límites |
| ACT-02 | Actividades | recurso e instructor no se solapan en confirmada | implementada pero sin prueba suficiente | SELECT previo a INSERT sin transacción |
| MESA-01 | Mesas | capacidad y misma mesa/fecha/hora confirmada | comprobada parcialmente | prueba cubre mismo slot |
| MESA-02 | Mesas | mantenimiento impide nuevas reservas | implementada pero sin prueba suficiente | SELECT previo a INSERT |
| PAR-01 | Parqueos | intervalos abiertos o cerrados no se solapan | implementada pero sin prueba suficiente | comparación `Op.lt`/`Op.gt`; sin transacción |
| SPA-01 | Spa | terapeuta activo y buffer de 15 minutos | implementada pero sin prueba suficiente | código; duración de servicio |
| TRA-01 | Transporte | recursos asignados dentro de ventana y con locks | implementada pero sin prueba suficiente | transacciones y `skipLocked` |
| AUTH-01 | Reservas protegidas | consultas/modificaciones ajenas se rechazan donde el service recibe requester | comprobada mediante inspección | eventos/transporte/habitaciones; cobertura desigual |
| AMB-01 | Todos | requisito de disponibilidad entre sucursales | `REQUIERE_CONFIRMACION_NEGOCIO` | no hay regla transversal explícita |
| AMB-02 | Todos | política de límites exactamente iguales | `REQUIERE_CONFIRMACION_NEGOCIO` | algunos dominios usan intervalos, otros slots |
