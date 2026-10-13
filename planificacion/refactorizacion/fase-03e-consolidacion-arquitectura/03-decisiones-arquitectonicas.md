# Decisiones arquitectónicas

| Decisión | Evidencia y motivo |
|---|---|
| Monolito modular | Conserva despliegue y transacciones actuales, pero permite límites por funcionalidad y pruebas incrementales. |
| Estructura por funcionalidad | `src/modules/sucursales` y `src/modules/configuraciones` agrupan sólo lo necesario para cada piloto. |
| Rutas | Declaran paths, middlewares y orden de autenticación/validación; siguen siendo fuente de Swagger durante la transición. |
| Controllers | Traducen Request/Response y delegan errores a `next`; no contienen consultas Sequelize. |
| Services | Contienen operaciones de negocio y acceso al modelo existente. |
| Validadores | Zod verifica body y params antes del controller. |
| Sequelize | Modelos, asociaciones y migraciones siguen compartidos y sin movimientos. |
| Fachadas | Se mantienen cuando preservan importadores públicos o el escaneo OpenAPI; no se eliminan por estética. |
| Composición Express | `app.ts` monta adapters modulares sin alterar URLs ni middleware global. |
| Errores | `AppError` y `errorHandler` centralizan códigos, status, redacción y logging. |
| Observabilidad | Request IDs, access logs y logger estructurado permanecen en middleware/utilidad compartida. |
| Pruebas | Unitarias, integración PostgreSQL, contratos HTTP, OpenAPI y arquitectura protegen capas diferentes. |
| OpenAPI | Se genera en memoria desde `src/routes/**/*.ts`; la especificación versionada protegida no es fuente de edición. |
| Transacciones | Sólo deben introducirse donde exista una garantía de negocio demostrable; no se agregaron abstracciones genéricas. |

No se recomiendan repositories, factories, contenedores de inyección ni DTOs globales sin un problema concreto y una prueba que justifique cada abstracción.
