# Resultados de validación

Baseline antes de agregar las dos regresiones:

- `npm test`: 63 pruebas exitosas en 14 archivos.
- `npm run test:unit`: 36 pruebas.
- `npm run test:integration`: 27 pruebas.
- `npm run test:coverage`: exitoso; 42.51% statements, 17.22% branches, 25.20% functions y 42.83% lines.
- `npm run typecheck`: exitoso.

Después de incorporar las pruebas de inventario OpenAPI y Swagger UI se confirmó:

- `npm test`: 65 pruebas exitosas en 14 archivos.
- `npm run test:unit`: 37 pruebas exitosas.
- `npm run test:integration`: 28 pruebas exitosas.
- `npm run test:coverage`: exitoso; 42.51% statements, 17.22% branches, 25.20% functions y 42.83% lines.
- `npm run typecheck`: exitoso.

La advertencia conocida de Vite ESM/CJS no bloquea Vitest. No se ejecutaron migraciones, pagos reales ni solicitudes externas.
