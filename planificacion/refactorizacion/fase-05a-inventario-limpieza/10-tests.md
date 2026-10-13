# Inventario de tests

| Archivo/grupo | Categoría | PostgreSQL | Clasificación | Valor |
|---|---|---:|---|---|
| `tests/integration/app.http.test.ts` | HTTP/webhook | no | ESENCIAL | contratos transversales |
| `postgres.auth.test.ts` | PostgreSQL/auth | sí | ESENCIAL | autenticación y roles |
| `postgres.payments.test.ts` | PostgreSQL/pagos | sí | ESENCIAL | ownership/idempotencia |
| `postgres.reservations.test.ts` | PostgreSQL/reservas | sí | ESENCIAL | concurrencia/rollback |
| `postgres.sucursales.test.ts` | PostgreSQL/módulo | sí | ESENCIAL | piloto modular |
| `unit/architecture.test.ts` | arquitectura | no | ESENCIAL | fachadas |
| `unit/openapi.test.ts` | OpenAPI | no | ESENCIAL | paths/operaciones |
| `unit/stripe.service.test.ts` | Stripe | no | ESENCIAL | firma/importes sin red |
| validators/auth/env/error/logger/ownership | unitarias | no | UTIL | contratos y seguridad |

La suite tiene 14 archivos y 65 pruebas. No hay evidencia suficiente para
marcar un test como obsoleto o duplicado; no eliminar ni modificar tests.
