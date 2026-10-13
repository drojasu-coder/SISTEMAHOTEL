# 01 — Auditoría del backend

## Alcance y corte auditado

- Repositorio: `drojasu-coder/SISTEMAHOTEL`.
- Rama de trabajo observada: `refactor/backend-architecture`.
- Commit auditado: `83d0827`, también apuntado por `origin/hardening/backend-final`.
- Base histórica de la auditoría de hardening: `origin/backup/integration-pre-hardening`, merge-base `0ecc9c2`.
- Esta fase es documental. No se modificaron controladores, rutas, modelos, migraciones, datos ni ramas protegidas.
- El árbol local tenía cambios preexistentes (`script.sql`, `Frontend/`, `backend/openapi.json`, scripts y documentación); se dejaron intactos.

## Reconocimiento técnico

| Área | Estado real |
|---|---|
| Runtime | Node.js, CommonJS, Express `^5.2.1`, TypeScript `^5.5.4`, `ts-node-dev`. |
| Persistencia | PostgreSQL 16 y Sequelize `^6.37.8`/`sequelize-cli`; modelos `.js` cargados dinámicamente por `src/models/index.js`. |
| Validación | Zod `^4.6.2`, middleware común para body, params y query. |
| Seguridad | JWT, `bcryptjs`, middleware de autenticación que vuelve a consultar el usuario y middleware de roles. |
| Integraciones | Stripe: Payment Intents, webhook con cuerpo raw y reembolsos. CORS abierto (`cors()` sin política explícita). |
| Documentación | Swagger generado desde comentarios en `src/docs/swagger.ts` y comentarios de rutas; existe `backend/openapi.json` como cambio local no rastreado. |
| Arranque | `src/server.ts` escucha en `env.PORT`; `src/app.ts` registra middleware, webhook, Swagger, health y 38 routers. |
| Base de datos | 38 tablas funcionales documentadas, `SequelizeMeta`, 41 migraciones y 3 seeders. Las migraciones históricas no deben editarse. |
| Pruebas | No se encontraron archivos `*.test.*`/`*.spec.*` ni script de test/build/lint en `backend/package.json`. |
| Frontend | Carpeta y documentación de diseño presentes, pero sin contrato generado independiente del backend. |

## Flujo actual

La intención declarada es `Route → Controller → Service → Model`. En la práctica:

1. Las rutas montadas bajo `/api` aplican de forma variable autenticación, roles y validadores.
2. Los controladores suelen traducir `req` a una llamada de servicio, pero hay dos familias de envolturas de respuesta.
3. Los servicios importan directamente `require("../../models")`; no existe capa de repositorio.
4. Sequelize resuelve modelos y asociaciones desde archivos JavaScript dinámicamente.
5. `AppError` y `errorHandler` centralizan parte de los errores, mientras que algunos servicios conservan estilos diferentes.
6. No se observan imports de controladores desde servicios ni de rutas desde servicios; la dependencia circular entre capas no quedó demostrada por el análisis textual. Sí existe acoplamiento transversal a `models`, `roles`, `AppError` y configuración.

## Hallazgos iniciales

### Críticos antes de una integración frontend

- **Contrato de respuesta no uniforme:** módulos antiguos devuelven `{status:"success",data}` y módulos recientes `{success:true,statusCode,message,data}`. Cambiarlo globalmente rompería clientes; debe versionarse o normalizarse con compatibilidad.
- **Ausencia de pruebas automatizadas:** las reglas de disponibilidad, propiedad, estados y pagos no tienen regresión ejecutable en el repositorio.
- **Credenciales por defecto en `src/config/config.json`:** aunque sean de desarrollo, producción también contiene usuario, contraseña, base y host literales. La conexión debe migrar a variables de entorno sin editar migraciones.
- **Webhook especial:** `/api/pagos/stripe/webhook` depende de bytes raw y está registrado antes de `express.json`; cualquier refactor de middleware puede invalidar pagos.

### Altos

- `pago.service.ts` (~29 KB), `reservaHabitacion.service.ts`, `reservaAmenidad.service.ts`, `reservaActividad.service.ts` y `reservaParqueo.service.ts` concentran reglas, consultas, transacciones y estados.
- Rutas extensas con documentación Swagger, middleware y composición de handlers mezclados; hay riesgo de divergencia entre documentación y ejecución.
- Duplicación de CRUD, conversión de errores Zod y autorización por módulo.
- Mezcla de TypeScript (aplicación) y JavaScript (modelos/migraciones/seeders), sin tipos de dominio compartidos.

### Medios

- `findAll`/`findByPk` y asociaciones se repiten sin una política transversal de paginación, selección de atributos o serialización.
- CORS, límites, logging y configuración no están encapsulados en un módulo de infraestructura.
- Seeders de desarrollo de pagos/Stripe están en el mismo árbol de ejecución que los datos demo; falta una política documentada de ambientes.

## Baseline de verificación

- `cd backend && npx tsc --noEmit`: **pasa** en el corte auditado.
- No se ejecutaron migraciones ni se alteró la base de datos.
- No se realizaron commits, merges ni cambios de rama.

## Conclusión

El backend es funcional y amplio, pero no está listo para una refactorización masiva ni para que el frontend consuma contratos sin una matriz de compatibilidad. La primera intervención autorizable debe ser de caracterización: congelar contratos observables, crear pruebas de regresión para hardening y centralizar observabilidad/configuración. La refactorización estructural debe venir después, módulo por módulo.
