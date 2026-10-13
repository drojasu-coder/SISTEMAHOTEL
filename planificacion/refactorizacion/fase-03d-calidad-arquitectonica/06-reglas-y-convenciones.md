# Reglas y convenciones pragmáticas

- Las rutas declaran endpoints y middlewares, y conservan la fuente documental requerida por Swagger.
- Los controllers traducen request/response y delegan errores a `next`.
- Los services contienen operaciones de negocio y acceso a persistencia.
- Los validators verifican entradas antes del controller.
- Los modelos y asociaciones permanecen en sus ubicaciones actuales.
- Los módulos pueden usar utilidades compartidas, pero no deben duplicar infraestructura ni reglas de otros dominios.
- Las fachadas sólo se eliminan con evidencia de ausencia de consumidores externos y una estrategia de compatibilidad.
