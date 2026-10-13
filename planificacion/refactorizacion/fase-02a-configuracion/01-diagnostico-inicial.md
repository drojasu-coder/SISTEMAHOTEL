# Fase 2A - Diagnostico inicial

## Hallazgos

- `src/config/env.ts` validaba valores de negocio y JWT, pero no validaba el ambiente,
  URLs, puertos ni la base de datos.
- `src/config/config.json` contenia usuario y contrasena PostgreSQL versionados.
- `src/models/index.js` y Sequelize CLI consumian `config.json`; la CLI no cargaba
  `DATABASE_URL` por si sola.
- Stripe y la zona horaria leian `process.env` directamente en varios modulos.
- El destino de pruebas existente es PostgreSQL en `127.0.0.1:55432/hotel_test_db`.

## Alcance aplicado

Se centralizo la validacion en `src/config/env.ts`, se creo un adaptador CommonJS
para Sequelize y se mantuvo la carga dinamica de modelos y asociaciones.
