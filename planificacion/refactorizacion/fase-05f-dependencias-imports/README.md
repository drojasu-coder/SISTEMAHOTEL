# Fase 5F — Dependencias, imports, tooling y vulnerabilidades

## Objetivo

Auditar `backend/package.json`, `backend/package-lock.json`, imports,
scripts npm, dependencias runtime/dev, tooling y vulnerabilidades sin
introducir cambios productivos especulativos.

## Alcance y resultado

- Se revisaron las 14 dependencias runtime y 13 dependencias de desarrollo
  declaradas.
- Se contrastaron imports estáticos/dinámicos, `require`, scripts, configuración
  de Sequelize, Swagger, Vitest, TypeScript y el compose de PostgreSQL.
- No se demostró ninguna dependencia directa `NO_USADA_DEMOSTRADA`.
- No se eliminaron paquetes ni se actualizaron versiones.
- `package.json` y `package-lock.json` permanecen sin cambios.
- No se modificaron imports productivos.

## Auditoría de vulnerabilidades

### AUDIT COMPLETO — `npm audit --json`

- 2 vulnerabilidades totales.
- 2 moderadas: `sequelize` → `uuid`.
- Clasificación: `RUNTIME`.

### AUDIT PRODUCCIÓN — `npm audit --omit=dev --json`

- 5 vulnerabilidades totales: 3 altas y 2 moderadas.
- 3 altas: `ts-node-dev` → `chokidar` → `braces`.
- 2 moderadas: `sequelize` → `uuid`.
- `ts-node-dev` es `devDependency`; por tanto, su cadena se clasifica
  `DEV_ONLY` aunque el comando `--omit=dev` la haya reportado en este árbol.
- La cadena `sequelize` → `uuid` se clasifica `RUNTIME`.

No se ejecutaron `npm audit fix`, `npm audit fix --force`, `npm install` ni
`npm update`. La sugerencia de Sequelize 3.x se clasifica
`FIX_INCOMPATIBLE_NO_APLICAR`; no se hizo downgrade de Sequelize, override
manual de `uuid` ni upgrade major automático.

## Validación

- `npm test`: 65/65
- `npm run test:unit`: 37/37
- `npm run test:integration`: 28/28
- `npm run typecheck`: correcto
- OpenAPI protegido por pruebas: 93 paths / 184 operaciones

## Decisión formal

**GO_FASE_5G**

La auditoría de Fase 5F queda cerrada porque las dependencias tienen uso
demostrable, los contratos y pruebas se conservan y no se aplicaron cambios de
dependencias. `GO_FASE_5G` no significa que las vulnerabilidades hayan
desaparecido: significa que la auditoría concluyó sin regresiones y puede
comenzar la revisión estructural de la siguiente fase.
