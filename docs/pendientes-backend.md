
- **Categoría:** mejora opcional
- **Revisión inspeccionada:** 2026-10-21 · `2ed9ef5`
- **Flujo afectado:** navegación del panel (qué módulos ve cada rol).
- **Comportamiento actual y evidencia:** el backend define seis roles (`backend/src/constants/roles.ts`) y aplica `requireRole` por ruta, pero no expone un catálogo dinámico de capacidades: `/auth/me` solo devuelve `rol`.
- **Resolución en Lote 1:** los permisos actuales ya permiten completar el lote. Se implementó en el cliente la tabla de permisos [PERMISSIONS](Frontend/src/features/auth/permissions.ts) derivada de los decoradores `requireRole` reales del backend, verificada contra la API real en [backendReal.integration.test.ts](Frontend/src/test/integration/backendReal.integration.test.ts). El panel filtra estrictamente las opciones accesibles mediante `getPanelModules`, protege cada ruta interna con `RequireAuth`, y redirige a los roles sin módulos operativos (como `empleado_operativo`) a su pantalla de `/cuenta`.
- **Mejora opcional a futuro:** evaluar si en fases posteriores el backend publicará una lista dinámica de capacidades o permisos por usuario en lugar de derivarlos del rol en cliente.
- **Estado:** resuelto para Lote 1 (mejora opcional a futuro).

## BE-006 · Documentación OpenAPI en sucursales y convención de envoltorio

- **Categoría:** mejora opcional
- **Revisión inspeccionada:** 2026-10-21 · `2ed9ef5`
- **Flujo afectado:** catálogo de sedes (`/api/sucursales`).
- **Estado de funcionamiento:** las operaciones del módulo (`GET`, `POST`, `PATCH`) funcionan plenamente y no están bloqueadas.
- **Detalle de las diferencias observadas:**
  1. **Diferencia de formato de respuesta (manejada por el cliente):**
     - El controlador (`backend/src/modules/sucursales/sucursal.controller.ts`) responde con `{ status: "success", data }`, a diferencia del envoltorio `{ success: true, statusCode: 200, data }` empleado en otros módulos.
     - Esta variación no representa un defecto ni un bloqueo: el cliente HTTP tipado (`Frontend/src/features/sedes/api/sedesApi.ts`) la consume directamente y desempaqueta `data` sin inconvenientes. A futuro, el backend puede evaluar si desea unificar este envoltorio por convención de estilo.
  2. **Esquemas de respuesta faltantes en OpenAPI:**
     - En `backend/src/routes/sucursales/sucursal.routes.ts`, las anotaciones Swagger para `POST /api/sucursales` (201) y `PATCH /api/sucursales/:id` (200) omiten la sección `content.application/json.schema`. Por ello, `openapi-typescript` genera `content?: never` en las respuestas de mutación en `schema.ts`.
     - Esto solo afecta la generación automática de tipos en TypeScript, no el comportamiento en tiempo de ejecución. El frontend lo resuelve mediante contratos tipados explícitos en [Frontend/src/features/sedes/types.ts](Frontend/src/features/sedes/types.ts).
- **Resolución en Lote 2:** el módulo quedó 100% integrado y funcional en el frontend utilizando tipos explícitos centralizados.
- **Criterio para cierre definitivo en backend:** añadir `$ref: '#/components/schemas/Sucursal'` a las respuestas 201 y 200 en `sucursal.routes.ts` para que `schema.ts` genere los tipos automáticamente.
- **Estado:** resuelto para Lote 2 (no bloqueante / mejora opcional de contrato para backend).

## BE-007 · Seguimiento de compatibilidad Node 22 y @types/node 26

- **Categoría:** mantenimiento técnico / tooling
- **Revisión inspeccionada:** 2026-10-22 · `refactor/backend-architecture`
- **Contexto:** el runtime del sistema ejecuta Node.js v22.x, mientras que `@types/node` está en v26.2.0 (requerido por `vite@8.3.4` / `vitest@5.0.4` cuya peer dependency exige `@types/node@"^20.19.0 || >=22.12.0"`).
- **Detalle técnico:**
  - `@types/node@26` declara en `globals.d.ts` que `NodeJS.AsyncIterator` hereda de `AsyncIteratorObject` (Iterator Helpers).
  - Sus `typesVersions` redirigen a `ts5.6/*`, pero dicha carpeta solo provee sustitutos para buffers y typedarrays, sin sustituir `globals.d.ts`.
  - En TypeScript 5.5, `AsyncIteratorObject` no existía en las librerías del compilador, provocando que `process.stdin` (de tipo `ReadStream`) presentara un error de incompatibilidad de método `next()` contra `NodeJS.ReadableStream`.
- **Resolución adoptada:** se actualizó `typescript` a `5.6.3` de forma exacta en `backend/package.json`, versión que introduce soporte intrínseco para `AsyncIteratorObject` y compatibilidad limpia con `@types/node@26` sin alterar otras dependencias. Para garantizar que los scripts de utilidad en `scripts/` mantengan su tipado comprobado sin alterar el `rootDir: "./src"` de producción, se incorporó `tsconfig.scripts.json` y el script `typecheck:all`.
- **Estado:** resuelto.
