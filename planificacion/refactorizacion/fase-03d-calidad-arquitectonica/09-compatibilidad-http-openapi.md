# Compatibilidad HTTP y OpenAPI

No cambiaron URLs, métodos, middlewares, autenticación, roles, validaciones, status ni formatos JSON. `sucursales` conserva GET/POST/PATCH/DELETE y `configuraciones` conserva GET/PATCH de IVA.

La especificación se genera en memoria desde los routers documentados. La regresión comprueba operaciones, parámetros y seguridad bearer sin modificar ni leer como fuente de edición `backend/openapi.json`.
