# Concurrencia

## Comprobado

Las pruebas PostgreSQL existentes ejecutan dos y tres creaciones simultáneas para una misma habitación. El resultado esperado es un único éxito, rechazos `409/HABITACION_NO_DISPONIBLE` y una sola fila persistida. También comprueban que habitaciones diferentes no se serializan innecesariamente.

La implementación bloquea la habitación dentro de una transacción antes de consultar solapamientos. Esto se conserva sin reescritura.

## Patrones de riesgo

- Actividades: `validateResourceOverlap`/`validateInstructorOverlap` consulta y luego `create` sin transacción.
- Mesas: `validateAvailability` consulta y luego `create` sin transacción.
- Parqueos: `validateOverlap` consulta y luego `create` sin transacción.
- Spa: consulta de terapeuta y solapamiento seguida de `create` sin transacción.

Dos solicitudes simultáneas podrían observar disponibilidad y escribir ambas. Se clasifica como riesgo reproducible por análisis de interleaving, no como defecto reproducido por una prueba persistente. No se añadió una prueba que falle deliberadamente ni se inventó una política de resolución.

Amenidades, eventos, servicios de eventos y transporte sí tienen mecanismos explícitos de serialización. No se afirmó que sus reglas cubran todos los casos hasta añadir fixtures de integración específicos.
