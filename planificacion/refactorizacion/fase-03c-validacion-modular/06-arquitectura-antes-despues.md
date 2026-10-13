# Arquitectura antes y después

Antes, configuración tenía controller y service en carpetas globales, con route en `src/routes/configuracion.routes.ts`.

Después, la implementación vive en `src/modules/configuraciones/` con `configuracion.controller.ts`, `configuracion.service.ts`, `configuracion.validator.ts` y un route adapter. Las fachadas globales reexportan controller y service para compatibilidad. El router original permanece como fuente OpenAPI y el adapter modular conserva el punto de montaje.
