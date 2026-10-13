# Verificación OpenAPI

Se importó `swaggerSpec` desde `src/docs/swagger.ts`, usando el mecanismo real de generación en memoria y sin leer `backend/openapi.json`.

La regresión automatizada verifica `/api/sucursales` con GET/POST, `/api/sucursales/{id}` con GET/PATCH/DELETE y `/api/configuraciones/iva` con GET/PATCH. También verifica bearer security en configuración y ausencia de operaciones duplicadas por comparación exacta de claves.
