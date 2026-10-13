# 7. Convenciones modulares

## Componentes

- `routes`: composición HTTP, middleware y path; sin reglas de negocio.
- `controllers`: traducción `Request/Response` y `next`; sin consultas Sequelize.
- `services`: casos de uso y reglas; reciben entradas explícitas.
- `validators`: esquemas Zod de body/params/query.
- `repositories`: sólo cuando oculten consultas repetidas o una frontera de persistencia tenga beneficio probado.
- `integrations`: clientes externos, por ejemplo Stripe; nunca secretos en controladores.
- `tests`: contrato HTTP, integración PostgreSQL y unitarias de reglas puras.

## Importaciones

Un módulo puede importar `platform` y tipos compartidos. Debe evitar importar archivos internos de otro módulo; la comunicación entre módulos usa una fachada pública o función de aplicación estable. Las rutas no importan modelos. Los modelos y migraciones permanecen como infraestructura compartida durante la transición.

## Nombres

Usar nombres de dominio en singular para servicios de una entidad y nombres de operación para casos de uso complejos. Mantener `.service.ts`, `.controller.ts`, `.routes.ts`, `.validator.ts` mientras coexistan las carpetas antiguas. Exportar sólo la API pública del módulo desde un `index.ts` cuando la extracción lo necesite.

No introducir DTOs, factories o interfaces vacíos. Cada nueva abstracción debe eliminar acoplamiento demostrado o habilitar una prueba concreta.

