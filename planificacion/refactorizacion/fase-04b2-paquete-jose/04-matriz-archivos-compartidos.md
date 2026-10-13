# Matriz de archivos compartidos

| Área | Archivos | Clasificación | Justificación |
|---|---|---|---|
| Composition root | `backend/src/app.ts` | Revisión conjunta | monta todos los routers y Swagger |
| Env/Sequelize | `src/config/env.ts`, `src/config/config.json`, `src/config/sequelize.config.js`, `.sequelizerc` | Revisión conjunta | afecta todos los ambientes y CLI |
| Middlewares globales | `src/middlewares/*`, `src/config/httpSecurity.ts` | Notificar a Diego; revisión conjunta para cambios | seguridad, errores, request IDs y parsing |
| Logging | `src/utils/logger.ts`, `request-logging.middleware.ts` | Reservado temporalmente a Diego | observabilidad transversal |
| Pilotos | `src/modules/sucursales/*`, `src/modules/configuraciones/*` | Evitar; coordinación obligatoria | módulos ya estabilizados y contratos OpenAPI |
| Pruebas arquitectura/OpenAPI | `tests/unit/architecture.test.ts`, `openapi.test.ts` | Notificar antes de modificar | protegen límites y conteos globales |
| Infraestructura de test | `tests/setup.ts`, `tests/integration/testDatabase.ts`, Vitest config | Reservado temporalmente a Diego | aislamiento PostgreSQL |
| Reglas de José | `src/routes/services/controllers/validators` del lote asignado | Libre dentro del lote | evitar solapamiento por dominio |
| Modelos/migraciones | `src/models/*`, `src/migrations/*` | Revisión conjunta y autorización | estructura de datos compartida |

“Libre” no significa autorizado a cambiar contratos de otros dominios. Los cambios transversales deben anunciarse antes.
