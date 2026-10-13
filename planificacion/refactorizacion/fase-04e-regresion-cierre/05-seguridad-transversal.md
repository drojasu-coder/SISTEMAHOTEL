# Seguridad transversal

La inspección y pruebas existentes cubren:

- Helmet y CORS;
- rate limiting y límites de body;
- JWT, expiración, usuario inactivo y roles;
- redacción de logs y request IDs;
- `AppError` y error handler;
- raw body y firma del webhook Stripe.

`app.http.test.ts`, `auth.validator.test.ts`, `error-handling.test.ts`,
`logger.test.ts`, `env.test.ts` y `stripe.service.test.ts` pasaron.

Deuda para Fase 5, sin refactorizar ahora: constantes repetidas,
middleware/fachadas legacy, comentarios históricos y configuración que
requiere separación entre variables de entorno, constantes de aplicación y
reglas de dominio.

No se encontraron secretos reales en los archivos examinados. Los valores de
test están limitados a fixtures.
