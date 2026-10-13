# 06 — Imports

Se revisaron imports estáticos, imports dinámicos y `require` en
`backend/src`, `backend/tests` y `backend/scripts`.

Hallazgos representativos:

- Express, CORS, Helmet, rate limit, Zod, JWT, bcrypt y Stripe se usan en
  runtime.
- Sequelize aparece en modelos, servicios y la infraestructura de pruebas.
- Swagger se importa desde la configuración de documentación y el exportador.
- Vitest y Supertest se usan en las suites.
- Imports dinámicos de servicios y `require` de modelos son intencionales por
  carga modular.
- Los paquetes de tipos sostienen el `typecheck`.

No se aplicó una limpieza estética ni se eliminó ningún import sin evidencia
de que el cambio fuera seguro.

