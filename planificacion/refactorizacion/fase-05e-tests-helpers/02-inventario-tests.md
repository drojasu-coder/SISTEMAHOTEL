# Inventario de tests

| Archivo | Categoría | PostgreSQL | HTTP | Clasificación | Propósito |
|---|---|---:|---:|---|---|
| `unit/auth.validator.test.ts` | validación | no | no | UTIL | registro y login |
| `unit/env.test.ts` | configuración | no | no | ESENCIAL | validación de entorno |
| `unit/error-handling.test.ts` | middleware | no | no | ESENCIAL | AppError y sanitización |
| `unit/logger.test.ts` | observabilidad | no | no | ESENCIAL | redaction y request paths |
| `unit/stripe.service.test.ts` | Stripe | no | no | ESENCIAL | importes y firmas sin red |
| `unit/openapi.test.ts` | contrato | no | no | ESENCIAL | 93 paths / 184 operaciones |
| `unit/architecture.test.ts` | arquitectura | no | no | ESENCIAL | fachadas, adapters y ciclos |
| `unit/payment-ownership.test.ts` | autorización | no | no | UTIL | ownership de pagos |
| `unit/reservation-payment.validators.test.ts` | validación | no | no | UTIL | reservas y pagos |
| `integration/app.http.test.ts` | HTTP | no | sí | ESENCIAL | seguridad y contratos HTTP |
| `integration/postgres.auth.test.ts` | auth | sí | sí | ESENCIAL | persistencia y roles |
| `integration/postgres.payments.test.ts` | pagos | sí | no | ESENCIAL | ownership e idempotencia |
| `integration/postgres.reservations.test.ts` | reservas | sí | no | ESENCIAL | solapamiento y concurrencia |
| `integration/postgres.sucursales.test.ts` | módulo | sí | no | ESENCIAL | CRUD y conflicto de sucursal |

La tabla enumera los 14 archivos `*.test.ts` de las suites. `tests/setup.ts` y
`tests/integration/testDatabase.ts` son infraestructura de soporte y se
documentan en las secciones correspondientes; por ello no forman parte de las
14 filas de suites.

No existe un archivo temporal u obsoleto demostrado.
