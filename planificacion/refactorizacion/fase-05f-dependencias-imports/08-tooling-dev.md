# 08 — Tooling de desarrollo

- TypeScript compila con `tsc --noEmit`.
- Vitest ejecuta unitarias, integración y cobertura.
- `ts-node-dev` sólo participa en el script local `dev`.
- Sequelize CLI participa en migraciones y seeders.
- Swagger mantiene el contrato documentado y su exportador.
- `docker-compose.yml` aporta PostgreSQL/pgAdmin; no es una dependencia npm.

El warning de configuración ESM/CJS de Vitest quedó observado como riesgo de
tooling, sin modificar `vitest.config.ts` ni `package.json`.
