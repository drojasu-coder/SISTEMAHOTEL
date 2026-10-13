# 1. Inventario verificable

## Conteos

El inventario fue obtenido con `find` sobre el árbol actual, no desde OpenAPI:

| Superficie | Conteo | Ubicación |
|---|---:|---|
| Controladores TypeScript | 38 | `backend/src/controllers` |
| Servicios TypeScript | 40 | `backend/src/services` |
| Rutas TypeScript | 38 | `backend/src/routes` |
| Validadores TypeScript | 38 | `backend/src/validators` |
| Modelos Sequelize JavaScript | 39 | `backend/src/models` |
| Migraciones | 41 | `backend/src/migrations` |
| Middlewares | 6 | `backend/src/middlewares` |
| Archivos de pruebas | 13 | `backend/tests` |

Un archivo no equivale a una entidad: varias rutas agrupan operaciones CRUD y varios servicios contienen múltiples casos de uso.

## Módulos funcionales reales

Los directorios presentes son: autenticación, usuarios, habitaciones, eventos, actividades, amenidades, bienestar, transporte, carritos, pagos, parque, personal, proveedores, restaurante, sucursales, configuración y facturación. Hay además componentes transversales de configuración, documentación, utilidades, tipos y seguridad.

## Integración de la aplicación

`src/app.ts` monta 38 superficies de rutas, el webhook de Stripe, Swagger, health check, parsers, CORS, Helmet, rate limiting y manejo de errores. La carga de modelos es dinámica en `src/models/index.js`; las asociaciones se ejecutan después de cargar los 39 modelos.

## Pruebas

Las pruebas HTTP cubren contratos y middleware. Las pruebas PostgreSQL cubren autenticación, pagos y reservas. Las unitarias cubren validadores, errores, logger, conversión de montos Stripe, entorno y ownership de pagos. No existe una suite aislada por cada módulo funcional.

