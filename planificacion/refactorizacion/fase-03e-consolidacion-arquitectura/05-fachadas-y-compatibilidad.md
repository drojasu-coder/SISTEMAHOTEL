# Fachadas y compatibilidad

Las fachadas `src/controllers/configuracion.controller.ts`, `src/services/configuracion.service.ts`, `src/controllers/sucursales/sucursal.controller.ts` y `src/services/sucursales/sucursal.service.ts` sólo reexportan la implementación modular. No se detectaron consumidores internos adicionales, pero se conservan como API de compatibilidad para importadores externos, pruebas y futuras integraciones.

Los adapters `src/modules/sucursales/sucursal.routes.ts` y `src/modules/configuraciones/configuracion.routes.ts` sí tienen una función activa: `app.ts` entra por el módulo, mientras `swagger-jsdoc` escanea `src/routes/**/*.ts`. Reexportar el router evita dos implementaciones activas y conserva la documentación.

Las pruebas arquitectónicas verifican identidad de exports entre fachadas e implementación y equivalencia de adapters y routers. No se eliminaron archivos legacy porque no existe evidencia suficiente para garantizar que ningún consumidor externo dependa de ellos.
