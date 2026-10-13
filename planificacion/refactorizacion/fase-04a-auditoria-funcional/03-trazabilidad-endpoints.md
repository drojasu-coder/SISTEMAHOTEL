# Trazabilidad de endpoints

La convención de trazabilidad es:

`app.ts` mount → `src/routes/<dominio>/<recurso>.routes.ts` → controller → service → validator → modelo Sequelize.

La correspondencia por recurso se mantiene regular en 35 catálogos CRUD: router, controller, service, validator y modelo con nombre de dominio equivalente. Las excepciones funcionales son:

- `auth`: controller/service de identidad y validadores de login/register.
- `pagos`: controller de pagos, services de pago/Stripe y webhook raw montado fuera del parser JSON.
- carritos: rutas anidadas y servicios separados de carrito/item.
- reservas: services con cambios de estado, cancelación, asignación o lógica de disponibilidad.
- `configuraciones` y `sucursales`: implementación modular con routers legacy como fuente OpenAPI y fachadas de compatibilidad.

La inspección confirma que las rutas no importan modelos directamente. Las rutas declaran middleware; controllers coordinan HTTP; services acceden a `src/models`; validators Zod verifican entrada. No se afirma que cada endpoint tenga una prueba HTTP individual.

El inventario de archivos es verificable en `backend/src/routes`, `controllers`, `services`, `validators` y `models`; los nombres de rutas y montajes están listados en `02-inventario-endpoints.md`.
