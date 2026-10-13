# PostgreSQL y Sequelize

No se modificaron modelos, migraciones, dialecto, pool ni aislamiento de
pruebas. `TEST_DATABASE_URL` continúa siendo la fuente exclusiva del ambiente
test y el archivo CLI Sequelize conserva la configuración existente.

No se ejecutaron migraciones ni conexiones contra desarrollo o producción.
