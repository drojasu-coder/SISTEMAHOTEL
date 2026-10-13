# Pruebas y resultados

Resultados ejecutados durante la Fase 2A:

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Exitoso |
| `npm run test:unit` | Exitoso: 5 archivos, 21 pruebas |
| `npm test` | Exitoso: 9 archivos, 38 pruebas |
| `npm run test:integration` | Exitoso: 4 archivos, 17 pruebas |
| `npm run test:coverage` | Exitoso: 38 pruebas; statements 40.65%, branches 13.69%, functions 22.53%, lines 40.95% |
| Carga de `sequelize.config.js` en test | Exitosa |
| `npx sequelize-cli db:migrate:status` en test | Exitoso: 41 migraciones `up` |

La suite de integracion uso el PostgreSQL aislado existente en el puerto 55432.
Vitest mostro la advertencia previa sobre configuracion CommonJS/ESM; no bloqueo
las ejecuciones.
