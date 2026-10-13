# Regresión

Validación final ejecutada después de los cambios:

- `cd backend && npm test`: 65/65;
- `cd backend && npm run test:unit`: 37/37;
- `cd backend && npm run test:integration`: 28/28;
- `cd backend && npm run typecheck`: correcto;
- OpenAPI protegido por tests: 93 paths / 184 operaciones.

La validación de entorno existente continúa cubriendo configuración válida,
variables obligatorias ausentes, valores inválidos, defaults y aislamiento de
`TEST_DATABASE_URL`.
