# 04 — DevDependencies

- `vitest`: runner y APIs de las 14 suites `*.test.ts`.
- `supertest` y `@types/supertest`: pruebas HTTP y sus tipos.
- `@vitest/coverage-v8`: script `test:coverage`.
- `typescript` y `@types/node`: compilación y tipos del proyecto.
- `@types/express`, `@types/cors`, `@types/jsonwebtoken`,
  `@types/swagger-jsdoc`, `@types/swagger-ui-express`: tipos de imports runtime.
- `ts-node-dev`: script `dev`.
- `sequelize-cli`: scripts de migraciones y seeders.

La clasificación `DEV_ONLY` no implica que los paquetes sean eliminables:
varios son requeridos por scripts o compilación.
