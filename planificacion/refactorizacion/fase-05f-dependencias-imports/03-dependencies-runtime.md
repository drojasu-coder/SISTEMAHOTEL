# 03 — Dependencias runtime

- `express`: aplicación HTTP y router.
- `cors`, `helmet`, `express-rate-limit`: middleware de seguridad y política
  HTTP.
- `bcryptjs`, `jsonwebtoken`: credenciales y tokens.
- `dotenv`, `zod`: carga y validación de configuración.
- `sequelize`, `pg`, `pg-hstore`: ORM, driver PostgreSQL y serialización.
- `stripe`: integración y verificación de pagos.
- `swagger-jsdoc`, `swagger-ui-express`: generación y publicación de OpenAPI.

Cada paquete tiene imports, configuración o montaje verificable en
`backend/src`, scripts o pruebas de contrato.

