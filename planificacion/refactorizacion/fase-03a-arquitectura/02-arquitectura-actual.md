# 2. Arquitectura AS-IS

## Flujo principal

La composición comprobada es:

`app.ts → route → middleware de autenticación/rol/validación → controller → service → modelo Sequelize → PostgreSQL → respuesta`.

El webhook de Stripe es una excepción deliberada: `app.ts` lo monta antes de `express.json()` para conservar el `Buffer` raw; el controlador llama al servicio Stripe y al servicio de pagos.

## Capas actuales

- **Rutas:** registran endpoints, validadores, roles y documentación OpenAPI.
- **Controladores:** traducen `req/res`, invocan servicios y delegan errores a `next`.
- **Servicios:** contienen casos de uso, reglas, consultas, transacciones y coordinación de integraciones.
- **Modelos:** JavaScript Sequelize dinámico con asociaciones.
- **Infraestructura transversal:** `env`, seguridad HTTP, logger, JWT, AppError y Swagger.

## Fortalezas

Existe una separación reconocible entre HTTP y servicios, validación Zod centralizada, errores comunes, configuración validada, pruebas de integración PostgreSQL y protección específica de concurrencia. La estructura por dominio dentro de rutas/servicios/validadores permite localizar funcionalidad.

## Límites actuales

La separación no es un límite de módulo: los servicios acceden directamente al objeto global de modelos y varias operaciones grandes mezclan autorización, consultas, transacciones, Stripe y cambios de estado. Las rutas contienen mucha documentación OpenAPI, lo que infla su tamaño pero no necesariamente su complejidad de negocio.

