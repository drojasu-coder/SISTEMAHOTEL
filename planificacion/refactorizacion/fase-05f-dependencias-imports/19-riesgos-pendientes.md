# 19 — Riesgos pendientes

## Vulnerabilidades

- `RUNTIME`: 2 moderadas en la cadena `sequelize` → `uuid`.
- `DEV_ONLY`: 3 altas en la cadena `ts-node-dev` → `chokidar` → `braces`.
- `npm audit --json` reportó 2 vulnerabilidades.
- `npm audit --omit=dev --json` reportó 5 vulnerabilidades; se conserva ese
  resultado aunque `ts-node-dev` sea `devDependency`.
- La propuesta `sequelize@3.30.0` es
  `FIX_INCOMPATIBLE_NO_APLICAR`.

## Mantenimiento futuro

- Versiones mayores disponibles para Stripe y dotenv.
- Actualizaciones menores disponibles que requieren su propia regresión.
- Warning preexistente de Vitest sobre ESM/CJS.

Estos riesgos no se silencian ni se presentan como resueltos. No se ejecutaron
`npm audit fix`, `npm audit fix --force`, `npm install` ni `npm update`; tampoco
se hizo downgrade de Sequelize, override manual de `uuid` o upgrade major
automático.
