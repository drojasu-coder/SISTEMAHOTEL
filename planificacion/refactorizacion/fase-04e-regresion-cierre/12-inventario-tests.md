# Inventario de pruebas

## Esenciales

- `tests/integration/postgres.reservations.test.ts`: reservas y persistencia.
- `tests/integration/postgres.payments.test.ts`: ownership e idempotencia.
- `tests/integration/postgres.auth.test.ts`: autenticación PostgreSQL.
- `tests/integration/postgres.sucursales.test.ts`: módulo piloto.
- `tests/integration/app.http.test.ts`: contratos HTTP y webhook raw.
- `tests/unit/openapi.test.ts`: OpenAPI.
- `tests/unit/architecture.test.ts`: arquitectura.
- `tests/unit/stripe.service.test.ts`: Stripe sin red externa.

## Útiles

`auth.validator.test.ts`, `env.test.ts`, `error-handling.test.ts`,
`logger.test.ts`, `payment-ownership.test.ts` y
`reservation-payment.validators.test.ts`.

No se identificó un duplicado seguro ni un test obsoleto. No se eliminaron
tests; la cobertura global baja no es criterio suficiente para hacerlo.
