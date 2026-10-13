# Módulos implementados

## Sucursales

Archivos modulares: `backend/src/modules/sucursales/sucursal.{routes,controller,service,validator}.ts`. El adapter conserva el router documentado en `backend/src/routes/sucursales/sucursal.routes.ts`. Se mantienen GET de colección/recurso, POST, PATCH y DELETE, autorización ADMIN, validación de IDs y errores `BRANCH_NOT_FOUND`/`BRANCH_IN_USE`.

## Configuraciones

Archivos modulares: `backend/src/modules/configuraciones/configuracion.{routes,controller,service,validator}.ts`. Se conservan GET/PATCH de `/api/configuraciones/iva`, bearer authentication, rol ADMIN para actualización, IVA por defecto 12 y `IVA_CONFIGURATION_INVALID`.

## Alcance real

Sólo estos dos dominios piloto fueron reorganizados. Los restantes controllers, services, routes, validators y modelos siguen en la estructura legacy. Reservas, pagos, facturas, carritos, reembolsos y Stripe no fueron modularizados en esta fase.
