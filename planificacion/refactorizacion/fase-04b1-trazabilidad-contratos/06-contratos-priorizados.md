# Contratos priorizados

## Sucursales

`GET /api/sucursales` y `GET /api/sucursales/{id}` son consultas; POST/PATCH/DELETE requieren autenticación y rol ADMIN según router. Los validadores cubren body y params. La suite PostgreSQL verifica CRUD, 404, conflicto `BRANCH_IN_USE` y 204. OpenAPI verifica operaciones.

## Configuraciones

`GET /api/configuraciones/iva` requiere bearer. `PATCH /api/configuraciones/iva` requiere bearer y ADMIN, valida `porcentaje_iva`, conserva respuesta 200 y creación implícita con valor 12 cuando no existe configuración. La prueba HTTP verifica autenticación; OpenAPI verifica métodos y security.

## Health y Swagger

`GET /api/health` es público y devuelve 200 con el contrato JSON existente. `/api/docs/` sirve Swagger UI. Las nuevas regresiones verifican ambos contratos sin escribir datos.

## Stripe

`POST /api/pagos/stripe/webhook` queda fuera de JWT, usa cuerpo raw y requiere firma Stripe. La suite verifica request inválida, pero no ejecuta pagos ni utiliza claves reales.

Los demás endpoints están inventariados en CSV; su estado es parcial o insuficiente cuando no existe prueba específica. No se introducen códigos HTTP, schemas ni reglas nuevas.
