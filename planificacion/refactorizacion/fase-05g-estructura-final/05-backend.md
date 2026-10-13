# 05 — Backend

`backend/` contiene la aplicación Express/TypeScript, tests Vitest,
configuración, migraciones, modelos, seeders, scripts locales y manifests npm.

- `src/` no se reorganiza nuevamente: las fases 3 y 5C ya validaron su
  arquitectura.
- `tests/` conserva sus suites y soporte.
- `package.json` y `package-lock.json` permanecen intactos.
- `tsconfig.json` y `vitest.config.ts` permanecen intactos.
- `.env.example` sí es documentación de configuración; `.env` está ignorado.
- `openapi.json` y `scripts/` requieren decisión humana por su estado untracked.

Clasificación general: `MANTENER_BACKEND`.
