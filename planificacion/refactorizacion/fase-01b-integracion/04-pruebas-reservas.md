# Fase 1B — Pruebas reales de reservas

`postgres.reservations.test.ts` ejecuta contra PostgreSQL real:

- Habitación: creación, solapamiento y aceptación de intervalos adyacentes.
- Mesa: conflicto del mismo horario.
- Actividad: conflicto de recurso/instructor.

Resultado: **4/4 pruebas exitosas**.

La concurrencia con transacciones independientes y límites de tiempo todavía no está
implementada. Tampoco se ha caracterizado exhaustivamente cancelación, actualización,
recursos inactivos e intervalos de todos los módulos. No se modificaron reglas
productivas ni se asumieron reglas comunes entre módulos.
