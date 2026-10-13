# Configuración actual

`src/config/env.ts` es la única fuente TypeScript para configuración runtime.
Usa Zod, defaults explícitos y validaciones de ambiente:

- `development`, `test` y `production`;
- `TEST_DATABASE_URL` aislada a localhost:55432/hotel_test_db;
- `DATABASE_URL` para ambientes no test;
- Stripe opcional o completamente configurado;
- `CORS_ORIGINS` obligatoria en producción;
- límites, rate limit y logging configurables.

El archivo Sequelize CLI mantiene su integración CommonJS y usa las variables
existentes sin crear otra estrategia.
