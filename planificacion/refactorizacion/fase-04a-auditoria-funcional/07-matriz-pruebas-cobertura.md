# Matriz de pruebas y cobertura

## Resultados

- `npm test`: 63 pruebas exitosas, 14 archivos.
- `npm run test:unit`: 36 pruebas, 9 archivos.
- `npm run test:integration`: 27 pruebas, 5 archivos.
- `npm run test:coverage`: exitoso.
- Statements: 42.51%; branches: 17.22%; functions: 25.20%; lines: 42.83%.
- `npm run typecheck`: exitoso.

## Evidencia por tipo

| Tipo | Archivos | Alcance real |
|---|---|---|
| HTTP/Supertest | `app.http.test.ts` | health, IDs, errores, seguridad transversal, auth requerida, CORS, Stripe raw |
| PostgreSQL | `postgres.auth.test.ts` | registro/login, JWT, expiración, usuario inactivo |
| PostgreSQL | `postgres.reservations.test.ts` | reservas y concurrencia |
| PostgreSQL | `postgres.payments.test.ts` | pagos y ownership |
| PostgreSQL | `postgres.sucursales.test.ts` | CRUD, 404 y conflicto de sucursal |
| OpenAPI | `openapi.test.ts` | paths/operaciones de pilotos y bearer security |
| Arquitectura | `architecture.test.ts` | fachadas, adapters y ciclos relativos |
| Unitarias | validators, env, errores, logger, Stripe, ownership | reglas aisladas y mocks |

## Brechas priorizadas

No existe cobertura HTTP/PostgreSQL individual para cada uno de los 184 endpoints efectivos. Faltan escenarios sistemáticos de límites, idempotencia, estados inválidos, permisos por recurso y errores de persistencia para varios dominios. La prioridad debe ser reservas/pagos/facturación antes que aumentar cobertura de catálogos simples.
