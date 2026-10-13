# 2. Contratos originales

Base `/api/sucursales`:

- `GET /`: público; `200 { status: "success", data: [...] }`, orden por `nombre ASC`.
- `GET /:id`: público; `200 { status: "success", data }`; ID validado con `idParamSchema`; inexistente: `404 BRANCH_NOT_FOUND`.
- `POST /`: `authMiddleware` + rol `ADMIN` + `createSucursalSchema`; `201 { status: "success", data }`.
- `PATCH /:id`: JWT + `ADMIN` + `idParamSchema` + `updateSucursalSchema`; `200` con el mismo envoltorio.
- `DELETE /:id`: JWT + `ADMIN` + `idParamSchema`; `204` sin cuerpo.

La creación acepta `nombre`, `direccion`, `ciudad`, `telefono`. La actualización acepta esos campos y `activa`. El borrado devuelve `409 BRANCH_IN_USE` cuando existen habitaciones asociadas.

La documentación OpenAPI original se conserva en `src/routes/sucursales/sucursal.routes.ts`; el escáner de Swagger continúa leyendo `src/routes/**/*.ts`.

