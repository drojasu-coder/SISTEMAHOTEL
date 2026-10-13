# Evidencia de verificaciones

## Comandos ejecutados

- `npm test`: 63 pruebas exitosas.
- `npm run test:unit`: 36 pruebas exitosas en 9 archivos.
- `npm run test:integration`: 27 pruebas exitosas en 5 archivos.
- `npm run test:coverage`: exitoso; 42.51% statements, 17.22% branches, 25.20% functions, 42.83% lines.
- `npm run typecheck`: exitoso.
- Conteo estático: 38 routers, 182 operaciones de router.
- Conteo del `backend/openapi.json` existente: 93 paths y 184 operaciones; no se modificó.

## Restricciones

Las pruebas PostgreSQL de integración pasaron usando la configuración existente de test. No se ejecutaron migraciones manuales ni solicitudes manuales a desarrollo/producción. Stripe se verificó sólo mediante fixtures/mocks y el webhook HTTP existente; no se usaron claves reales ni se enviaron eventos externos.

La advertencia de Vite sobre ESM/CJS apareció durante Vitest y no bloqueó resultados. La especificación local OpenAPI es un artefacto protegido; la auditoría contó sus operaciones sólo como evidencia, mientras la generación en memoria se cubre por la prueba existente.
