# Fase 1B — Resultados de ejecución

| Comando | Resultado |
|---|---|
| `npm test` | 8 archivos, 27 pruebas exitosas |
| `npm run test:unit` | 4 archivos, 14 pruebas exitosas |
| `npm run test:integration` | 4 archivos, 13 pruebas exitosas |
| `npm run test:coverage` | exitoso; statements 39.79%, branches 10.46%, functions 21.39%, lines 40.12% |
| `npm run typecheck` | exitoso |

La suite completa incluye pruebas unitarias, HTTP aisladas y PostgreSQL real. La
advertencia de Vitest sobre configuración ESM/CommonJS no bloquea la ejecución.
Cobertura no debe interpretarse como cobertura funcional completa.
