# Fase 1B — Comparación de contratos API

Se compararon las declaraciones de rutas montadas en `src/app.ts` y los routers con
`backend/openapi.json`, normalizando parámetros Express (`:id`) y OpenAPI
(`{id}`), y contando métodos HTTP exactos.

- Operaciones OpenAPI: **184**.
- Operaciones declaradas por código: **184** después de incluir el montaje multilínea
  `/api/reservas-evento/:reservaId/servicios`.
- Diferencias de método/ruta: **ninguna**.

Esta comparación no certifica todavía igualdad de esquemas de request/response,
autenticación, roles o códigos HTTP; esos elementos deben validarse como contratos
por operación antes de la integración frontend. `openapi.json` se trató como
documentación local y no se modificó.
