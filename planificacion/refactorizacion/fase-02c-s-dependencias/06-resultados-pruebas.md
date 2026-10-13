# Resultados de pruebas

Después de las correcciones no forzadas:

| Comando | Resultado |
|---|---|
| `npm test` | Exitoso: 10 archivos, 51 pruebas |
| `npm run test:unit` | Exitoso: 6 archivos, 28 pruebas |
| `npm run test:integration` | Exitoso: 4 archivos, 23 pruebas |
| `npm run test:coverage` | Exitoso: 51 pruebas; statements 41.63%, branches 15.84%, functions 23.52%, lines 41.93% |
| `npm run typecheck` | Exitoso |
| `npx sequelize-cli db:migrate:status` | Exitoso: 41 migraciones `up` |
| `npm audit` | 5 vulnerabilidades pendientes: 3 altas y 2 moderadas |
| `npm audit --omit=dev` | 2 vulnerabilidades moderadas pendientes |
| `npm ls ...` | Versiones corregidas verificadas |

Las 51 pruebas anteriores continúan pasando, incluyendo autenticación, Stripe y
concurrencia de reservas.
