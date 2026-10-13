# 12 — Vulnerabilidades y riesgos pendientes

## Resultados verificados

### AUDIT COMPLETO

`npm audit --json` reportó 2 vulnerabilidades moderadas, ambas de
`RUNTIME`: `sequelize` → `uuid`.

### AUDIT PRODUCCIÓN

`npm audit --omit=dev --json` reportó 5 vulnerabilidades: 3 altas y 2
moderadas. Las 3 altas de `ts-node-dev` → `chokidar` → `braces` se clasifican
`DEV_ONLY`; las 2 moderadas de `sequelize` → `uuid` se clasifican `RUNTIME`.

El comando `--omit=dev` reportó la cadena de tooling en este árbol aunque
`ts-node-dev` es `devDependency`. Se registra el resultado literal y se
mantiene la clasificación por dependencia declarada.

## Deuda pendiente

1. `uuid` transitivo de Sequelize: vulnerabilidad moderada; el fix de npm
   requiere una degradación mayor de Sequelize. Estado:
   `FIX_INCOMPATIBLE_NO_APLICAR`.
2. `braces` transitivo de `chokidar`, usado por `ts-node-dev`: vulnerabilidad
   alta `DEV_ONLY`; npm no ofrece fix automático en el árbol actual.
3. `ts-node-dev`: vulnerabilidad alta transitiva en su cadena de desarrollo.

## Tratamiento

No se ejecutaron `npm audit fix`, `npm audit fix --force`, `npm install` ni
`npm update`. No se aplicó downgrade de Sequelize, override manual de `uuid` ni
upgrade major automático. Estas vulnerabilidades quedan como deuda técnica y
mantenimiento futuro; no se convierten automáticamente en trabajo de Fase 5G.
