# Pruebas y resultados

Resultados ejecutados en el entorno actual:

| Comando | Resultado |
|---|---|
| `npm test` | Exitoso: 10 archivos, 51 pruebas |
| `npm run test:unit` | Exitoso: 6 archivos, 28 pruebas |
| `npm run test:integration` | Exitoso: 4 archivos, 23 pruebas |
| `npm run test:coverage` | Exitoso: 51 pruebas; statements 41.63%, branches 15.84%, functions 23.52%, lines 41.93% |
| `npm run typecheck` | Exitoso |
| `npx sequelize-cli db:migrate:status` | Exitoso: 41 migraciones `up` |

La prueba HTTP focalizada cubre CORS permitido y rechazado, preflight, headers,
JSON invalido, body excesivo y 429. La suite existente conserva autenticacion,
Stripe y concurrencia.
