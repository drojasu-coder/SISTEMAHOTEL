# 10 — AUDIT PRODUCCIÓN: `npm audit --omit=dev`

Resultado real de `npm audit --omit=dev --json`:

- 5 vulnerabilidades: 3 altas y 2 moderadas.
- Altas: `ts-node-dev` → `chokidar@3.6.0` → `braces@3.0.3`.
- Moderadas: `sequelize` → `uuid@8.3.2`.
- `ts-node-dev`, `chokidar` y `braces` se clasifican `DEV_ONLY`, porque
  pertenecen a la cadena de la `devDependency` `ts-node-dev`.
- `sequelize` y `uuid` se clasifican `RUNTIME`.
- Para `braces`/`chokidar`/`ts-node-dev`, npm no ofrece fix automático.
- Para Sequelize, el fix sugerido es una degradación mayor incompatible:
  `FIX_INCOMPATIBLE_NO_APLICAR`.

Aunque `ts-node-dev` es `devDependency`, este comando reportó su cadena en el
árbol actual. Se conserva el conteo real de npm y se diferencia de la
clasificación funcional `DEV_ONLY`; no se presenta como vulnerabilidad runtime.

No se ejecutaron `npm audit fix`, `npm audit fix --force`, `npm install` ni
`npm update`. No se hizo downgrade de Sequelize, override manual de `uuid` ni
upgrade major automático.
