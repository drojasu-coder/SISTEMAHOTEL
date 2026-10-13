# Concurrencia

`postgres.reservations.test.ts` conserva pruebas reales PostgreSQL para:

- dos solicitudes simultáneas sobre una habitación;
- tres solicitudes simultáneas sobre una habitación;
- solicitudes paralelas sobre habitaciones distintas;
- conflictos, cancelación y rollback.

Usa `Promise.allSettled`, `Promise.all`, locks/transacciones del servicio y
timeouts explícitos. No se sustituyó por mocks ni se simplificó.
