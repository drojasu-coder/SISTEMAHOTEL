# Pruebas y resultados

Resultados de la validacion final:

| Comando | Resultado |
|---|---|
| `npm test` | Exitoso: 10 archivos, 45 pruebas |
| `npm run test:unit` | Exitoso: 6 archivos, 28 pruebas |
| `npm run test:integration` | Exitoso: 4 archivos, 17 pruebas |
| `npm run test:coverage` | Exitoso: 45 pruebas; statements 41.19%, branches 15.18%, functions 23.09%, lines 41.48% |
| `npm run typecheck` | Exitoso |
| `npx vitest run tests/unit/error-handling.test.ts` | Exitoso: 7 pruebas |

La suite de integracion uso el PostgreSQL aislado existente y mantuvo las
pruebas de concurrencia de reservas.
