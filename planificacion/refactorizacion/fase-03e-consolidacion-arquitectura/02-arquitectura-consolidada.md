# Arquitectura consolidada

El sistema sigue siendo un monolito Express con composición en `backend/src/app.ts`, rutas por dominio, controllers HTTP, services de negocio, validadores Zod y modelos Sequelize compartidos. La modularización no reemplaza el despliegue ni mueve la infraestructura de persistencia.

Entradas activas:

- `app.ts` monta `modules/sucursales/sucursal.routes.ts` y `modules/configuraciones/configuracion.routes.ts`.
- Cada route adapter reexporta el router legacy que contiene las declaraciones OpenAPI.
- Los routers legacy importan controllers y validators modulares.

La arquitectura objetivo de 3A proponía módulos mayores (`identity`, `lodging`, `commerce`, `payments`, etc.) y una plataforma compartida. Eso sigue siendo una dirección, no una implementación completa. Los modelos y migraciones permanecen deliberadamente en sus ubicaciones actuales.

La separación actual es suficiente para continuar con integración controlada, no para afirmar aislamiento total entre dominios.
