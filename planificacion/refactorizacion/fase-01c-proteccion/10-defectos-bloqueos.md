# Fase 1C — Defectos y bloqueos

## DEF-1 — Carrera en reservas de habitación

- **Pasos:** iniciar el PostgreSQL aislado; ejecutar
  `npx vitest run tests/integration/postgres.reservations.test.ts`.
- **Esperado:** una solicitud exitosa, una respuesta de conflicto y una reserva.
- **Observado:** dos solicitudes exitosas para el mismo recurso/intervalo.
- **Gravedad:** alta; permite doble reserva durante solicitudes concurrentes.
- **Estado:** reproducible, no corregido por esta fase.

La refactorización estructural queda bloqueada para el módulo de reservas hasta decidir
una corrección explícita y añadir una prueba verde que preserve la regla.
