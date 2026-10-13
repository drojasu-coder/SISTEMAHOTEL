# Estados

| Dominio | Estados observados | Bloqueo/transición |
|---|---|---|
| Reserva habitación | `pendiente`, `confirmada`, `cancelada`, `finalizada`, `expirada` | sólo pendiente/confirmada bloquean disponibilidad |
| Reserva evento | `cotizacion`, `confirmada`, `cancelada` | cotización/confirmada bloquean salón |
| Reserva amenidad | `confirmada`, `cancelada`, `usada` | cancelada/usada son terminales |
| Reserva actividad | `confirmada`, `cancelada`, `completada` | solapamiento consulta confirmada |
| Reserva mesa | `confirmada`, `cancelada` | solapamiento consulta confirmada |
| Transporte | `pendiente`, `confirmada`, `cancelada` | pendiente permite edición/reintento |
| Cita spa | `confirmada` y estados aceptados por validator | buffer consulta confirmada |
| Parqueo | sin estado en el modelo | DELETE físico; historial es decisión pendiente |
| Recursos físicos | habitación/mesa/parqueo `disponible`, `ocupada`, `mantenimiento` | mantenimiento bloquea; ocupada no siempre |

Se observaron estados hardcodeados en services, validators y migraciones. No se refactorizaron. Las transiciones permitidas no son homogéneas y deben limpiarse sólo después de confirmar negocio.
