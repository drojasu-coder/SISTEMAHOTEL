# 11 — `npm outdated`

Se ejecutó `npm outdated --json` sin instalar nada.

Actualizaciones observadas:

- Parche/menor disponible: `@types/node`, `express`, `pg`, `zod`,
  `typescript` dentro de la versión declarada.
- `dotenv` tiene una versión mayor posterior.
- `stripe` tiene una versión mayor posterior.

No se aplicaron actualizaciones: incluso los cambios menores requieren
validación posterior y los mayores tienen riesgo de contrato. Quedan para una
subfase específica de upgrades.
