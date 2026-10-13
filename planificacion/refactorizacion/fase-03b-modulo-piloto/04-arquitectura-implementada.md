# 4. Arquitectura implementada

Se creó `src/modules/sucursales/` con:

- `sucursal.service.ts`: casos de uso y acceso a los modelos existentes.
- `sucursal.controller.ts`: adaptación Express y delegación de errores.
- `sucursal.validator.ts`: exportación del esquema Zod existente, sin duplicarlo.
- `sucursal.routes.ts`: adaptador transitorio al router documentado.

`app.ts` monta ahora el entrypoint del módulo. El entrypoint delega al router original para conservar las anotaciones OpenAPI; ese router importa ya el controlador y validador del módulo. Así sólo existe una implementación activa de cada operación.

Los archivos antiguos de controller/service quedan como fachadas de compatibilidad para importadores existentes y reexportan el módulo. No contienen una segunda implementación.

