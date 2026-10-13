# PostgreSQL y Sequelize

No se activó logging SQL indiscriminado. `SLOW_QUERY_THRESHOLD_MS` queda centralizado como preparación de configuración, pero no se instrumentaron consultas individuales porque Sequelize no expone aquí una métrica segura sin modificar la configuración de logging.

Los errores PostgreSQL continúan clasificados por el error handler. Métricas de pool, deadlocks y latencia de consulta requieren instrumentación dedicada en Fase 3.

