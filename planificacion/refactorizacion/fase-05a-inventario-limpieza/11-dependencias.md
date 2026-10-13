# Dependencias

`backend/package.json` contiene dependencias runtime y de desarrollo; el
lockfile está versionado y no se modificó.

| Grupo | Dependencias | Clasificación |
|---|---|---|
| HTTP/security | Express, CORS, Helmet, rate-limit | `USADA` |
| auth | jsonwebtoken, bcryptjs | `USADA` |
| persistence | Sequelize, pg, pg-hstore | `USADA` |
| validation/config | Zod, dotenv | `USADA` |
| payments | Stripe | `USADA` |
| docs | swagger-jsdoc, swagger-ui-express | `USADA` |
| tests | Vitest, Supertest, coverage-v8 | `DEV_ONLY` |
| tooling | TypeScript, ts-node-dev, sequelize-cli, @types/* | `DEV_ONLY` |

No se marcó ninguna como `POSIBLEMENTE_NO_USADA` sin un análisis de imports y
scripts más profundo. No ejecutar `npm audit fix --force`, uninstall ni
downgrades.
