# Seguridad y observabilidad

## Verificado

- `src/config/env.ts` valida entorno, URL PostgreSQL de pruebas, JWT y configuración Stripe sin exponer valores.
- `httpSecurity.ts` configura CORS, Helmet y rate limiting de autenticación.
- JWT y roles se prueban en integración.
- `error.middleware.ts` centraliza códigos/status y evita devolver detalles internos.
- `request-logging.middleware.ts` asigna `X-Request-ID` y registra método, ruta, status y duración.
- Logger estructurado redacta información sensible; Stripe conserva el webhook con cuerpo raw y firma.

## Pendiente

Estas medidas no equivalen a una certificación completa de seguridad. Faltan revisión operacional de secretos, rotación, almacenamiento de logs, alertas, límites distribuidos y validación del despliegue real. Las vulnerabilidades transitivas conocidas de `uuid` asociadas a Sequelize permanecen documentadas porque corregirlas exigiría una incompatibilidad de dependencia; no se actualizó ninguna dependencia en esta fase.
