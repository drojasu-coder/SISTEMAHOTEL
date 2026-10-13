# Auditoría de dependencias

El composition root `src/app.ts` concentra la composición de Express y monta rutas de dominios. Las rutas coordinan middlewares y controllers; los controllers coordinan HTTP; los services ejecutan operaciones y acceden a Sequelize; los validadores permanecen en la capa de entrada; los modelos siguen en `src/models`.

Se encontraron 180 archivos TypeScript y 432 aristas relativas resolubles. Los dos módulos migrados dependen de utilidades, validadores legacy y modelos compartidos, pero no introducen dependencias hacia otros dominios de negocio.

El análisis no considera aliases no relativos, resolución dinámica, reflexión de CommonJS ni dependencias externas. Por ello, el resultado es evidencia estática acotada, no una prueba matemática de todo el grafo en ejecución.
