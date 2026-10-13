# Pruebas agregadas

Se justificaron dos pruebas deterministas de bajo riesgo:

1. `backend/tests/unit/openapi.test.ts`: cuenta 93 paths y 184 operaciones en la especificación generada en memoria. Protege contra pérdida accidental de documentación o montaje durante cambios paralelos.
2. `backend/tests/integration/app.http.test.ts`: solicita `/api/docs/` y verifica status 200 y presencia de Swagger UI. Protege la disponibilidad observable de la documentación.

No escriben en PostgreSQL, no usan credenciales, no llaman Stripe y no interfieren con el trabajo de José. No se modificó ninguna implementación para hacerlas pasar.
