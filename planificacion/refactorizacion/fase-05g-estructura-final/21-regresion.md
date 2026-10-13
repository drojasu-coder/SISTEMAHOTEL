# 21 — Regresión

La validación de cierre se ejecutó sin tocar runtime:

- `npm test`: 65/65
- `npm run typecheck`: correcto
- `npm run test:unit`: 37/37
- `npm run test:integration`: 28/28
- OpenAPI: 93 paths / 184 operaciones

Los tests unitarios e integración se incluyen para confirmar explícitamente el
gate y no por cambios de código. El warning preexistente de Vitest sobre ESM y
CJS no bloquea la suite.
