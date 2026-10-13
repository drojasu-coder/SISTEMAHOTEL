# Fase 2C-S - Auditoria inicial

La auditoria se ejecuto desde `backend` antes de modificar dependencias.

## Resultado inicial

`npm audit` reporto 9 vulnerabilidades: 1 critica, 4 altas y 4 moderadas.
`npm audit --omit=dev` reporto 5 vulnerabilidades: 1 critica y 4 moderadas.

Rutas relevantes:

- `proxy-addr` y `qs`: produccion, introducidas por Express/body-parser.
- `moment` y `uuid`: produccion, introducidas por Sequelize 6.
- `braces` y parte de `brace-expansion`: desarrollo, introducidas por
  `ts-node-dev`, `chokidar`, `sequelize-cli` y tooling Swagger.

El proyecto usa `trust proxy` configurable y rate limiting por IP; por eso
`proxy-addr` es una alerta directamente relevante para la superficie HTTP.
