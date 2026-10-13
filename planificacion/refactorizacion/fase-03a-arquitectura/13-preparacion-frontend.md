# 13. Preparación del frontend

La modularización debe preservar rutas, métodos, status, cuerpos JSON, códigos de error, autenticación Bearer, roles y validadores. El frontend dependerá especialmente de los contratos de auth, reservas, carritos, pagos y Stripe; ninguno debe cambiar en 3A.

Las decisiones de arquitectura deben mantener fechas y zona horaria centralizadas, errores con `success/statusCode/code/message`, filtros y paginación tal como existan hoy, y `X-Request-ID` para soporte. OpenAPI debe seguir siendo una fuente revisable, pero `backend/openapi.json` está protegido y no se modifica en esta fase.

Subidas de archivos e imágenes no tienen una frontera identificada en este inventario; deben auditarse antes de diseñar un adaptador. Stripe seguirá siendo backend-only: el frontend sólo recibe los datos de intención permitidos y no secretos.

Trabajo de Fase 5: cliente web, gestión de sesión, UX, caché y adaptación de errores. Trabajo modularizable: fachadas de casos de uso, validación y límites de integración sin cambiar contrato.

