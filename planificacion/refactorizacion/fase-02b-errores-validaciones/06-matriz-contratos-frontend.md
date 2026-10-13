# Matriz de contratos HTTP para frontend

Esta matriz describe el comportamiento implementado y probado en esta fase.

| HTTP | Estado | Codigo implementado | Verificado | Nota |
|---|---|---|---|---|
| 400 | Implementado | `VALIDATION_ERROR`, `INVALID_JSON`, `INVALID_WEBHOOK_REQUEST` | Si | Entrada invalida |
| 401 | Implementado | `AUTH_TOKEN_REQUIRED`, `INVALID_TOKEN`, `TOKEN_EXPIRED` | Si | Autenticacion |
| 403 | Implementado | `USER_INACTIVE`, `INVALID_USER_ROLE`, ownership | Si | Permisos/acceso |
| 404 | Implementado | Codigos de recurso existentes | Parcial | Depende del endpoint |
| 409 | Implementado | `DUPLICATE_RESOURCE`, `FOREIGN_KEY_CONFLICT` y conflictos de negocio | Si | Estado o integridad |
| 422 | Implementado | `DATABASE_VALIDATION_ERROR` y validaciones de negocio | Si | Datos no procesables |
| 429 | Recomendado | Ninguno identificado | No | Requiere rate limiting autorizado |
| 500 | Implementado | `INTERNAL_SERVER_ERROR` | Si | Error inesperado |
| 503 | Implementado | `DATABASE_UNAVAILABLE`, deadlock, lock timeout y Stripe | Si | Dependencia temporal |

La estructura actual usa `success`, `statusCode`, `code`, `message` y `details`
opcional. No se adopta un formato nuevo en esta fase.
