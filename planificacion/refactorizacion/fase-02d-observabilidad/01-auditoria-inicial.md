# Auditoría inicial

Antes de esta fase solo existían `console.log` en el arranque y `console.error` en el manejador de errores. No había request ID, access log ni política común de redacción. Sequelize CLI ya mantiene `logging: false`, por lo que no se imprimen sentencias SQL ni parámetros.

El error handler conserva sus respuestas y ahora emite metadata segura con el request ID. Stripe mantiene su endpoint raw y firmado.

