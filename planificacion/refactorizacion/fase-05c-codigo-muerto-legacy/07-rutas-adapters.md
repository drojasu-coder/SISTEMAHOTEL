# Rutas y adapters

Los adapters de sucursales y configuraciones se conservaron. `app.ts` los
monta y `docs/swagger.ts` analiza `src/routes/**/*.ts`; eliminarlos o mover la
documentación podría reducir los 93 paths y 184 operaciones.

Resultado: no hay ruta no montada demostrada como muerta. Las rutas no
montadas aparentes requieren revisión funcional posterior y no se eliminaron.
