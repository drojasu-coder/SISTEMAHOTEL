# Fase 1C — Concurrencia de reservas

Se ejecutó una prueba con dos llamadas simultáneas al servicio de habitaciones,
conexiones del pool PostgreSQL y timeout de 5 segundos. Se comprobó el estado final
persistido antes de limpiar el recurso.

## Resultado

La regla esperada era una solicitud exitosa, una rechazada con conflicto y una sola
reserva persistida. El resultado observado fue **dos solicitudes exitosas** para el
mismo recurso e intervalo. La prueba falla de forma reproducible.

Esto constituye una condición de carrera: la comprobación de disponibilidad y la
inserción no están protegidas conjuntamente por una restricción o transacción que
serialice el recurso.
