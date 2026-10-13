# Fase 1C — Estado del entorno de pruebas

- Rama: `refactor/backend-architecture`.
- PostgreSQL: contenedor `hotel_postgres_test`, imagen `postgres:16`.
- Destino verificado: `127.0.0.1:55432/hotel_test_db`.
- Usuario verificado: `hotel_test_user`.
- No se tocaron `main`, `hardening/backend-final`, migraciones ni datos de desarrollo.

La identidad de la base se comprobó antes de ejecutar escrituras. El harness rechaza
cualquier URL distinta de la URL aislada esperada.
