# Fase 2B - Auditoria del manejo de errores

## Inventario previo

- `AppError` era el mecanismo central y ya contenia `statusCode`, `code`,
  `message`, `details` e `isOperational`.
- El middleware global convertia errores de Sequelize, JSON invalido y
  `AppError`, pero no delegaba cuando `headersSent` ya era verdadero.
- Los tres middlewares Zod repetian la transformacion de issues y producian
  diferencias entre body, params y query.
- JWT ya convertia expiracion y tokens invalidos a codigos estables.
- Stripe ya usaba `AppError`; sus errores de configuracion no exponian secretos.
- Los controladores usan `next(error)` en los flujos asincronos; Express 5
  tambien propaga promesas rechazadas.
- UNIQUE, FK, validacion, conexion y timeout de Sequelize ya tenian mapeos.
  Deadlock y lock timeout PostgreSQL no tenian una respuesta especifica.

## Riesgos encontrados

El registro de errores incluia el stack completo, que puede contener mensajes
SQL o datos sensibles. Los errores inesperados ya tenian respuesta generica,
pero faltaba una prueba directa de esa garantia.
