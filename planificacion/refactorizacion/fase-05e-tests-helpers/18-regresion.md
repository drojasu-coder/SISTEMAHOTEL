# Regresión

Validación final después de la auditoría:

- `cd backend && npm test`: 65/65;
- `cd backend && npm run test:unit`: 37/37;
- `cd backend && npm run test:integration`: 28/28;
- `cd backend && npm run typecheck`: correcto;
- OpenAPI: 93 paths / 184 operaciones.

No hubo reducción de tests, por lo que no existe pérdida que justificar.
Las pruebas PostgreSQL continúan aisladas mediante `TEST_DATABASE_URL`.
