# Preparación para frontend

## Disponible actualmente

- Rutas HTTP existentes y documentadas parcialmente mediante OpenAPI.
- Respuestas de error centralizadas con `statusCode`, `code` y `message`.
- Bearer JWT y roles ADMIN en las rutas protegidas.
- Request IDs y logging para diagnóstico.
- PostgreSQL/Sequelize y ambientes de prueba aislados.
- Stripe y archivos mantienen límites de seguridad específicos.

## Parcial o futuro

No todos los endpoints tienen esquemas OpenAPI exhaustivos. Paginación y filtros varían por dominio; fechas y zonas horarias requieren contrato explícito; no existe todavía una política de archivos/S3; DTOs deben decidirse caso por caso para no exponer modelos Sequelize; y el frontend debe conocer errores y expiración JWT.

El frontend puede avanzar en paralelo contra endpoints estables y mocks documentados, pero la integración real de reglas de José y los dominios críticos debe preceder a flujos de reservas/pagos. No se implementó frontend ni S3.
