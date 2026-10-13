# Fase 1D — Regresión y limitaciones

Resultados reales de la matriz:

- `npm test`: **8 archivos, 31/31 pruebas exitosas**.
- `npm run test:unit`: **4 archivos, 14/14 pruebas exitosas**.
- `npm run test:integration`: **4 archivos, 17/17 pruebas exitosas**.
- `npm run test:coverage`: **exitoso**; statements 40%, branches 11.04%,
  functions 21.65%, lines 40.33%.
- `npm run typecheck`: **exitoso**.

Comandos ejecutados:

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:coverage`
- `npm run typecheck`

La corrección no agrega una restricción de base de datos. Si otro proceso inserta
reservas sin adquirir el lock de la habitación, esa ruta podría eludir esta garantía.
La actualización de reservas, parqueo, mesa, actividad y amenidad sigue pendiente de
caracterización transaccional.
