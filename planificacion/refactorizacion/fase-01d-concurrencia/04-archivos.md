# Fase 1D — Archivos modificados

- `backend/src/services/habitaciones/reservaHabitacion.service.ts`
  - transacción en creación;
  - bloqueo de la habitación;
  - propagación de la transacción a disponibilidad e inserción.
- `backend/tests/integration/postgres.reservations.test.ts`
  - concurrencia de dos y tres solicitudes;
  - habitaciones distintas;
  - cancelación, reemplazo y rollback;
  - limpieza limitada a fixtures propios.

No se modificaron migraciones, modelos persistentes, pagos, Stripe ni otros módulos.
