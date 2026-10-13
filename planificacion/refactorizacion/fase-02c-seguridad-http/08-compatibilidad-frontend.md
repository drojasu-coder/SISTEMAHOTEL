# Compatibilidad con el futuro frontend

El frontend debe usar la URL base del ambiente y enviar:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
Origin: http://localhost:5173
```

Desarrollo local puede usar `http://localhost:3000` o `http://localhost:5173`.
Produccion debe registrar su origen explícitamente en `CORS_ORIGINS`.

Debe manejar 401 (renovar/iniciar sesión), 403 (permisos/origen), 429
(esperar y reintentar respetando headers `RateLimit`) y 413 (reducir payload).
OPTIONS es preflight y responde 204. Las cabeceras de seguridad no requieren
logica especial en el frontend.
