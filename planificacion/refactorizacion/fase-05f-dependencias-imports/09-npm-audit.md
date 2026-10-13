# 09 — AUDIT COMPLETO: `npm audit`

Resultado real de `npm audit --json`, ejecutado sin modificar el árbol:

- 2 vulnerabilidades moderadas.
- `sequelize` directo, vía `uuid`.
- `uuid` transitivo, rango afectado `<11.1.1`.
- Clasificación: `RUNTIME`.
- Fix propuesto: `sequelize@3.30.0`, clasificado
  `FIX_INCOMPATIBLE_NO_APLICAR` por ser un cambio mayor incompatible.

No se ejecutaron `npm audit fix`, `npm audit fix --force`, `npm install` ni
`npm update`. Tampoco se hizo downgrade de Sequelize, override manual de
`uuid` ni upgrade major automático.
