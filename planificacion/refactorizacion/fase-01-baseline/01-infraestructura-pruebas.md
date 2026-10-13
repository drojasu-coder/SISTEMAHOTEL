# 01 — Infraestructura de pruebas

## Herramientas seleccionadas

- **Vitest 5.0.4:** compatible con TypeScript, mocks y ejecución rápida; se eligió un solo framework.
- **Supertest 7.3.1:** prueba la instancia Express sin abrir un puerto real.
- **@vitest/coverage-v8:** cobertura reproducible mediante el script existente de esta fase.
- **PostgreSQL 16:** se dejó un compose aislado para pruebas; no se inició ni se ejecutaron migraciones automáticamente.

## Archivos añadidos

- `backend/vitest.config.ts`
- `backend/tests/setup.ts`
- `backend/tests/unit/*.test.ts`
- `backend/tests/integration/app.http.test.ts`
- `backend/docker-compose.test.yml`

## Scripts

```bash
cd backend
npm test
npm run test:unit
npm run test:integration
npm run test:coverage
npm run typecheck
```

## Aislamiento

`tests/setup.ts` establece `NODE_ENV=test`, variables sintéticas y una clave Stripe `sk_test_` ficticia. No contiene credenciales de desarrollo. Las pruebas HTTP importan `app`, no `server`, por lo que no abren un puerto.

El archivo `docker-compose.test.yml` usa el contenedor, base, usuario, volumen y puerto `55432` exclusivos de pruebas. Antes de usarlo:

```bash
cd backend
docker compose -f docker-compose.test.yml up -d postgres-test
DATABASE_URL=postgres://hotel_test_user:hotel_test_password@127.0.0.1:55432/hotel_test_db NODE_ENV=test npx sequelize-cli db:migrate
```

La URL debe verificarse antes de migrar. Nunca se debe usar `docker compose down -v` sobre el compose de desarrollo; el volumen de prueba es independiente.

## Efectos de importación

`src/app.ts` carga routers y el índice dinámico de modelos Sequelize, pero no llama `listen`. Stripe se instancia de forma diferida al usar una operación. Las pruebas actuales no ejecutan consultas de persistencia ni realizan llamadas a Stripe.
