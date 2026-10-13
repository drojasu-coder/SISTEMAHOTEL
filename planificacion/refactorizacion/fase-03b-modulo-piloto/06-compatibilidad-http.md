# 6. Compatibilidad HTTP

Se mantienen sin cambios:

- `/api/sucursales`.
- Métodos GET, POST, PATCH y DELETE.
- Orden de autenticación, rol y validación.
- Status 200, 201, 204, 404 y 409.
- Envoltorio `{ status: "success", data }`.
- Mensajes/códigos `BRANCH_NOT_FOUND` y `BRANCH_IN_USE`.
- Raw paths y documentación OpenAPI.

El módulo no añade headers, paginación, filtros ni campos nuevos. Las pruebas de integración existentes de otros dominios continúan pasando, incluida autenticación, Stripe y reservas.

