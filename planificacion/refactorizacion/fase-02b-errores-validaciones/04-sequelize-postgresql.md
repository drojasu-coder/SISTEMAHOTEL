# Errores Sequelize y PostgreSQL

Se mantienen los mapeos existentes:

- UNIQUE: 409 `DUPLICATE_RESOURCE`.
- Foreign key: 409 `FOREIGN_KEY_CONFLICT`.
- Validacion Sequelize: 422 `DATABASE_VALIDATION_ERROR`.
- Conexion o timeout: 503 `DATABASE_UNAVAILABLE`.

Se agregan mapeos seguros para codigos PostgreSQL:

- `40P01`: 503 `DATABASE_DEADLOCK`.
- `55P03`: 503 `DATABASE_LOCK_TIMEOUT`.

Los errores de base que no coinciden con esos casos siguen siendo 500 y no se
convierten silenciosamente en conflictos funcionales. No se modificaron
transacciones, locks, servicios de reservas, pagos, migraciones ni modelos.
