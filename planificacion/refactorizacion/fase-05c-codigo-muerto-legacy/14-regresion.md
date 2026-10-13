# Regresión

## Baseline inicial

Antes de la auditoría se registró:

- `cd backend && npm test`: 65/65 pasados (37 unitarios y 28 de integración).
- `cd backend && npm run typecheck`: correcto.

## Validación final

Ejecutada después de la auditoría:

- `npm test`: 65/65;
- `npm run test:unit`: 37/37;
- `npm run test:integration`: 28/28;
- `npm run typecheck`: correcto;
- OpenAPI protegido por pruebas: 93 paths / 184 operaciones.

La suite incluye pruebas HTTP, arquitectura y OpenAPI. No se alteraron los
contratos ni se requirió una prueba de lote porque no hubo cambios productivos.
