# Auditoría del piloto de sucursales

`app.ts` monta `src/modules/sucursales/sucursal.routes.ts`. El route adapter delega al router legacy, que conserva los comentarios OpenAPI y consume controller y validator del módulo. Las fachadas legacy de controller y service reexportan la implementación modular; no mantienen reglas duplicadas.

Se revisaron GET de colección y recurso, POST, PATCH, DELETE, autenticación ADMIN, validaciones, 404, `BRANCH_NOT_FOUND`, `BRANCH_IN_USE` y 204 mediante la suite existente de PostgreSQL. No se detectaron ciclos nuevos ni cambios en modelos o asociaciones.
