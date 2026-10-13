# Riesgos y compatibilidad

- La actualización de `proxy-addr` es transitive y compatible con Express 5;
  se mantienen `trust proxy` y rate limiting.
- `qs` actualizado conserva los parsers de Express, Stripe y Superagent.
- `moment` actualizado conserva la API usada por Sequelize 6.
- `uuid` no se fuerza a 11 porque podría romper Sequelize.
- `braces` continúa como riesgo de desarrollo por `ts-node-dev`.
- npm reporto 9 vulnerabilidades adicionales durante la instalación de Helmet y
  rate limiting en la fase anterior; tras la corrección actual quedan 5.
- No se modificaron secretos, contratos HTTP, reglas de negocio, migraciones ni
  datos.
