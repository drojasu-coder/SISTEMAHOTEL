# Configuracion Sequelize y PostgreSQL

`backend/src/config/sequelize.config.js` es la entrada CommonJS compatible con
`sequelize-cli`. Carga `backend/.env` si existe y selecciona:

- `development` y `production`: `DATABASE_URL`.
- `test`: `TEST_DATABASE_URL`.

`src/models/index.js` usa el mismo adaptador, por lo que runtime y CLI comparten
la seleccion de ambiente. El adaptador rechaza un `TEST_DATABASE_URL` que no sea
`localhost:55432/hotel_test_db`. No se modificaron migraciones, tablas, columnas,
modelos ni asociaciones.
