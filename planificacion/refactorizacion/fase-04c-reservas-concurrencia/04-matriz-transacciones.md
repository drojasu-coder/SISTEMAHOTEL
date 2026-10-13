# Matriz de transacciones y atomicidad

| Operación/dominio | Transacción | Lock | Constraint explícito observado | Escrituras múltiples | Riesgo de parcialidad |
|---|---:|---:|---|---:|---|
| Crear habitación | Sí | habitación `FOR UPDATE` | no sustituye la validación | Sí | bajo dentro del service |
| Actualizar/cancelar habitación | Sí en operaciones críticas | habitación/reserva según operación | no observado | Sí | bajo, requiere regresión |
| Crear evento | Sí | salón `UPDATE` | no observado | Sí, reserva y montos | bajo |
| Modificar evento | Sí | reserva y salón según flujo | no observado | Sí | bajo |
| Servicios de evento create/update/delete | Sí | reserva `UPDATE` | no observado | item y montos | bajo |
| Crear amenidad | Sí | amenidad `UPDATE` | no observado | reserva | bajo |
| Actividad create/update | No | No | no observado | una escritura después de SELECT | alto frente a carrera |
| Mesa create/status | No | No | no observado | una escritura después de SELECT | alto frente a carrera |
| Parqueo create/update | No | No | no observado | una escritura después de SELECT | alto frente a carrera |
| Spa create/status | No | No | no observado | una escritura después de SELECT | alto frente a carrera |
| Transporte create/update/retry | Sí | vehículo, chofer y reserva | no observado | reserva y asignación | bajo; revisar `skipLocked` |

La ausencia de transacción no es automáticamente un defecto funcional fuera de concurrencia. Se recomienda una decisión conjunta antes de cambiar actividades, mesas, parqueos o spa, porque requeriría definir qué fila serializar y qué resultado debe ganar.
