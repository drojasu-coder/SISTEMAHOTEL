# Arquitectura final de variables de entorno

`src/config/env.ts` es la fuente de configuracion validada del runtime TypeScript.
`loadEnv` permite pruebas aisladas sin modificar el entorno global.

## Variables

- Requeridas: `EVENT_DEPOSIT_PERCENTAGE`, precios de parqueo, `JWT_SECRET`.
- Ambiente: `NODE_ENV` (`development`, `test` o `production`), `PORT` y
  `APP_TIMEZONE`.
- Base: `DATABASE_URL` para desarrollo/produccion; `TEST_DATABASE_URL` para tests.
- Opcionales: `TRANSPORT_BLOCK_MINUTES`, `CART_EXPIRATION_MINUTES`, `JWT_EXPIRES_IN`.
- Stripe opcional: `STRIPE_ENABLED`, `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.

Los secretos no se imprimen. Los errores solo reportan nombre de campo y regla.
