# 9. Archivos modificados y creados

## Creados

- `backend/src/modules/sucursales/sucursal.service.ts`
- `backend/src/modules/sucursales/sucursal.controller.ts`
- `backend/src/modules/sucursales/sucursal.validator.ts`
- `backend/src/modules/sucursales/sucursal.routes.ts`
- `backend/tests/integration/postgres.sucursales.test.ts`
- Los 11 documentos de esta carpeta y este `README.md`.

## Modificados

- `backend/src/app.ts`: monta el entrypoint modular.
- `backend/src/controllers/sucursales/sucursal.controller.ts`: fachada de reexportación.
- `backend/src/services/sucursales/sucursal.service.ts`: fachada de reexportación.
- `backend/src/routes/sucursales/sucursal.routes.ts`: consume controller/validator modulares y conserva OpenAPI.

No se modificaron otros dominios, `package.json`, `package-lock.json`, modelos, migraciones, `openapi.json` ni dependencias.

