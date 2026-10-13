# Pruebas y cobertura

Resultados posteriores a los cambios:

- `npm test`: 60 pruebas exitosas en 13 archivos.
- `npm run test:unit`: exitoso.
- `npm run test:integration`: exitoso.
- `npm run test:coverage`: exitoso; resumen 42.51% statements, 17.22% branches, 25.20% functions y 42.83% lines.
- `npm run typecheck`: exitoso.

La advertencia de Vite sobre configuración ESM/CJS no bloquea la ejecución. Las pruebas existentes de autenticación, reservas concurrentes y webhook Stripe permanecieron dentro de la suite ejecutada.
