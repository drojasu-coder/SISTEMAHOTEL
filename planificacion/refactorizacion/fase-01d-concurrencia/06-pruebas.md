# Fase 1D — Pruebas ejecutadas

La prueba de reservas PostgreSQL pasó **8/8**:

1. solapamiento secuencial;
2. intervalo adyacente;
3. conflicto de mesa;
4. conflicto de actividad;
5. dos solicitudes concurrentes;
6. tres solicitudes concurrentes;
7. habitaciones distintas;
8. cancelación, reemplazo y rollback por validación.

Las pruebas verifican el estado persistido en PostgreSQL y usan timeouts. La limpieza
elimina sólo IDs y recursos creados por el fixture.
