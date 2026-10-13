# Fase 1B — Configuración y aislamiento PostgreSQL

## Entorno verificado

- Rama: `refactor/backend-architecture`.
- Contenedor exclusivo: `hotel_postgres_test`.
- Imagen: `postgres:16`.
- Base: `hotel_test_db`.
- Usuario: `hotel_test_user`.
- Puerto host: `55432`.
- Volumen: `backend_hotel_pg_test_data`.
- El desarrollo utiliza otro puerto, base, contenedor y volumen.

`TEST_DATABASE_URL` apunta únicamente a `127.0.0.1:55432/hotel_test_db`. El harness
`backend/tests/integration/testDatabase.ts` rechaza URLs que no cumplan esa identidad.
No se utilizó `sequelize.sync({ force: true })`, `docker compose down -v`, ni se
modificaron `config.json` o `src/models/index.js`.

## Conclusión

El destino de las pruebas quedó aislado y verificable. El contenedor debe conservarse
para repetir la línea base; su eliminación requiere autorización explícita.
