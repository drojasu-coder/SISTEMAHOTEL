# 8. Pruebas y resultados

Resultados finales:

- Prueba específica `postgres.sucursales.test.ts`: **2/2 exitosas**.
- `npm test`: **57/57 exitosas** en 12 archivos.
- `npm run test:unit`: exitoso, **31 pruebas**.
- `npm run test:integration`: exitoso, **26 pruebas**.
- `npm run test:coverage`: exitoso.
- `npm run typecheck`: exitoso.

La suite conserva las 55 pruebas previas y agrega 2 del piloto. Las pruebas existentes de concurrencia de reservas, autenticación, pagos y webhook Stripe se ejecutaron dentro de la regresión.

La advertencia existente de Vitest sobre configuración ESM/CJS no bloqueó las pruebas.

