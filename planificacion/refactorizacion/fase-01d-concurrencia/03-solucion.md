# Fase 1D — Solución implementada

`createReservaHabitacion` ahora abre una transacción Sequelize, bloquea la fila de la
habitación antes de consultar disponibilidad, ejecuta la consulta de solapamiento y
crea la reserva usando la misma transacción.

El segundo intento para la misma habitación espera el desbloqueo, vuelve a leer bajo
`READ COMMITTED` y recibe el `409 HABITACION_NO_DISPONIBLE` existente. Los errores de
validación provocan rollback automático del callback transaccional.

No se cambiaron rutas, validadores, ownership, roles, estados, mensajes ni códigos.
