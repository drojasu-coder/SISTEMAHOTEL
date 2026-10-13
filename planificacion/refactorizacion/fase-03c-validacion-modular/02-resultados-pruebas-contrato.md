# Resultados de pruebas de contrato

La línea base previa a los cambios fue de 57 pruebas. Después se añadieron dos pruebas OpenAPI y una prueba HTTP de autenticación para configuración; la suite final reportó 60 pruebas exitosas.

La prueba HTTP confirma que GET y PATCH de `/api/configuraciones/iva` siguen requiriendo bearer token y conservan `AUTH_TOKEN_REQUIRED` con status 401. Las pruebas PostgreSQL de sucursales continúan cubriendo CRUD y errores funcionales.
