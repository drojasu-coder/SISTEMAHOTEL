# Separacion de ambientes

El ambiente se determina con `NODE_ENV`. Las pruebas nunca usan `DATABASE_URL`:
requieren `TEST_DATABASE_URL` y validan host, puerto y base aislados.

Ejemplos:

```bash
NODE_ENV=development npm run db:migrate
NODE_ENV=test npm run test:integration
NODE_ENV=production npm run db:migrate
```

Los valores de conexion deben existir solo en `.env` local o en el gestor de
secretos del despliegue. `.env.example` contiene placeholders.
