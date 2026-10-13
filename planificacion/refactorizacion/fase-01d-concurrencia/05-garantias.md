# Fase 1D — Garantías de concurrencia

- Dos o tres solicitudes simultáneas para la misma habitación/intervalo: una reserva
  persiste y las demás reciben conflicto.
- Habitaciones distintas: no comparten lock y pueden reservarse simultáneamente.
- Intervalos adyacentes: conservan la regla existente y son permitidos.
- Reservas canceladas: dejan de bloquear disponibilidad.
- Reintentos después de conflicto: pueden reconsultar y recibir el mismo conflicto sin
  crear duplicados.
- Timeout de prueba: 5 segundos; no se observó bloqueo indefinido.
- Deadlocks: no se reprodujeron en este flujo de creación, que bloquea una sola
  habitación por operación.

Las actualizaciones concurrentes no fueron convertidas a transacciones en esta fase.
