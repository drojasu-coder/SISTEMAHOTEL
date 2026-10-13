# Base de datos de test

`tests/setup.ts` fuerza `NODE_ENV=test` y configura
`TEST_DATABASE_URL` sintética. `integration/testDatabase.ts` rechaza cualquier
URL distinta de `localhost:55432/hotel_test_db`, autentica una conexión
Sequelize aislada y carga modelos/associations.

Cada suite PostgreSQL crea su propia conexión y la cierra en `afterAll`.
`sucursales` limpia por test; las otras suites limpian sus fixtures en
`afterAll`. No se usa `DATABASE_URL` de desarrollo.

`clearTestTables` existe como helper de limpieza general, pero no se usa por
ser demasiado amplio para estas suites con foreign keys; no se eliminó sin
evidencia de que sea obsoleto.
