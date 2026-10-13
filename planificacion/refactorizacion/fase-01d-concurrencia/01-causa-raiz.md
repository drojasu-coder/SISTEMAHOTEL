# Fase 1D — Causa raíz confirmada

Antes del cambio, `createReservaHabitacion` ejecutaba `validateOverlap` y después
`ReservaHabitacion.create` sin compartir una transacción. Dos solicitudes podían leer
el mismo estado libre antes de que cualquiera insertara su reserva.

La tabla `reservas_habitacion` sólo tenía claves foráneas y no una restricción
PostgreSQL de exclusión para intervalos/estados. Por tanto, la base no impedía el
duplicado lógico.

La reproducción de Fase 1C confirmó dos reservas aceptadas para la misma habitación y
el mismo intervalo.
