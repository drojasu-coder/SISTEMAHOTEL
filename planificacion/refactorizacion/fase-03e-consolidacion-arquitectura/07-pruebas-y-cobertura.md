# Pruebas y cobertura

Resultados verificados en `backend`:

- `npm test`: 63 pruebas exitosas en 14 archivos.
- `npm run test:unit`: 36 pruebas exitosas.
- `npm run test:integration`: 27 pruebas exitosas.
- `npm run test:coverage`: exitoso.
- Cobertura: 42.51% statements, 17.22% branches, 25.20% functions y 42.83% lines.
- `npm run typecheck`: exitoso.

La suite incluye PostgreSQL aislado, autenticación JWT y roles, sucursales, configuraciones, reservas concurrentes, pagos, Stripe, errores, OpenAPI y arquitectura modular. No se añadieron pruebas nuevas en 3E porque las pruebas arquitectónicas existentes ya cubren las decisiones de consolidación y no se identificó otra regresión de bajo riesgo con valor suficiente.

Brechas: no todos los endpoints legacy tienen contrato exhaustivo, y la cobertura global no representa por sí sola la cobertura de reglas críticas. Esas brechas requieren priorización por dominio, no expectativas artificiales en esta fase.
