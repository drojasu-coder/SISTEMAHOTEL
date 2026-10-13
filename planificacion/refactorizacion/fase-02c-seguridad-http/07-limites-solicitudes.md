# Limites de solicitudes

- JSON y URL-encoded: `REQUEST_BODY_LIMIT`, por defecto `1mb`.
- Webhook Stripe raw: `WEBHOOK_BODY_LIMIT`, por defecto `512kb`.
- Cuerpo excedido: 413 `REQUEST_ENTITY_TOO_LARGE`.
- JSON malformado: 400 `INVALID_JSON`.

El parser URL-encoded se habilita con `extended: false` y el webhook conserva
su parser raw separado.
