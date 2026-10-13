# 10 — OpenAPI

La fuente canónica runtime es `swaggerSpec` en `backend/src/docs/swagger.ts`.
`backend/src/app.ts` lo sirve mediante Swagger UI y las pruebas protegen 93
paths / 184 operaciones.

`backend/openapi.json` es un export local no versionado generado bajo demanda.
No se modificó su estado Git. Recomendación: conservar la generación
reproducible y decidir en revisión humana si se versiona como contrato para
frontend o si se mantiene como artefacto generado. No ignorarlo ni versionarlo
automáticamente en 5G.
