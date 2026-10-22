# Pendientes de backend

## BE-001 · Documentación OpenAPI en endpoints de autenticación

- **Categoría:** mejora de documentación / contrato OpenAPI
- **Revisión inspeccionada:** 2026-10-22 · `refactor/backend-architecture`
- **Flujo afectado:** documentación Swagger/OpenAPI de autenticación (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`).
- **Estado de funcionamiento:** las operaciones de autenticación funcionan correctamente en tiempo de ejecución.
- **Detalle de las diferencias observadas:**
  1. **Esquemas de respuesta faltantes en OpenAPI:**
     - En `backend/src/routes/auth.routes.ts`, las anotaciones Swagger para las respuestas 200/201 carecían de referencias a esquemas JSON (`content.application/json.schema`). Por ende, `openapi-typescript` generaba `content?: never` o respuestas vacías en el frontend.
  2. **Esquemas de request y respuestas de error omitidas:**
     - Faltaban esquemas de cuerpo de petición para registro (`RegisterRequest`) y login (`LoginRequest`), así como esquemas tipados de respuesta (`LoginResponse`, `RegisterResponse`, `AuthMeResponse`) y códigos de error (400, 401, 403, 409).
- **Resolución en frontend:**
  - El frontend utilizaba contratos tipados explícitos en `Frontend/src/features/auth/types.ts`.
- **Criterio para cierre definitivo en backend:**
  - Definir los esquemas en `swagger.ts` (`RegisterRequest`, `LoginRequest`, `AuthUser`, `AuthUserWithStatus`, `LoginData`, `LoginResponse`, `RegisterResponse`, `AuthMeResponse`), asociar los esquemas a `auth.routes.ts` para 200, 201 y errores, verificar mediante pruebas unitarias (`openapi.auth.test.ts`), y regenerar los tipos en el frontend (`Frontend/src/api/generated/schema.ts`).
- **Resolución definitiva:**
  - Incorporados los esquemas OpenAPI de autenticación en `swagger.ts`.
  - Documentadas las operaciones de login, register y me con sus códigos de respuesta y esquemas en `auth.routes.ts`.
  - Validadas mediante pruebas unitarias en `backend/tests/unit/openapi.auth.test.ts`.
  - Tipos regenerados en `Frontend/src/api/generated/schema.ts` y contratos de transporte sincronizados en `Frontend/src/features/auth/types.ts` y `Frontend/src/features/auth/api/authApi.ts`.
- **Estado:** resuelto.

## Capacidades y permisos por usuario en sesión (/auth/me)

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

## BE-008 · Inconsistencia en validación y persistencia de estado null en mesas

- **Categoría:** defecto de validación / inconsistencia de contrato
- **Revisión inspeccionada:** 2026-10-22 · `refactor/backend-architecture`
- **Flujo afectado:** creación y actualización de mesas (`POST /api/mesas`, `PATCH /api/mesas/:id`).
- **Comportamiento actual y evidencia:**
  - **Inspección de código:**
    - En `backend/src/validators/restaurante/mesa.validator.ts`, tanto `createMesaSchema` como `updateMesaSchema` declaran:
      ```ts
      estado: z.string().trim().max(20, "El estado no puede superar 20 caracteres").optional().nullable()
      ```
      lo que permite aceptar el valor `null`.
    - En el modelo Sequelize (`backend/src/models/mesa.js`), la columna se define como:
      ```js
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "disponible",
      }
      ```
      lo que rechaza valores `NULL` a nivel de base de datos.
    - No hay evidencia de que el backend rechace una cadena vacía (el validador no tiene `.min(1)`), pero el envío explícito de `null` causa un fallo de restricción en persistencia.
  - **Reproducción real:**
    - Se constató que al enviar `{ estado: null }` el validador responde favorablemente (pasa la validación Zod), pero la inserción/actualización falla con violación de restricción not-null en Sequelize/PostgreSQL.
- **Resolución en frontend:**
  - En `Frontend/src/features/mesas/schemas/mesaSchema.ts`, el formulario evita vaciar un estado existente en edición mostrando el mensaje neutral acordado: *"Conserve el estado actual o ingrese otro valor."* En creación, si el campo se deja en blanco, se omite del payload para que la base de datos aplique su valor por defecto (`disponible`).
- **Criterio para cierre definitivo en backend:**
  - Retirar `.nullable()` en los esquemas de validación de `mesa.validator.ts` para alinear la validación con la restricción `allowNull: false` de la tabla `mesas`.
- **Resolución definitiva:** se retiró `.nullable()` en `createMesaSchema` y `updateMesaSchema` en `mesa.validator.ts`, alineando la validación Zod con la restricción `allowNull: false` de Sequelize/PostgreSQL. Se incorporaron pruebas unitarias (`mesa.validator.test.ts`) e integración HTTP (`postgres.mesas.http.test.ts`).
- **Estado:** resuelto.

## BE-009 · Documentación OpenAPI incompleta en endpoints de mesas

- **Categoría:** mejora de documentación / contrato OpenAPI
- **Revisión inspeccionada:** 2026-10-22 · `refactor/backend-architecture`
- **Flujo afectado:** documentación Swagger/OpenAPI del catálogo de mesas (`/api/mesas`).
- **Estado de funcionamiento:** las operaciones del módulo (`GET /api/mesas`, `GET /api/mesas/:id`, `POST /api/mesas`, `PATCH /api/mesas/:id`, `DELETE /api/mesas/:id`) funcionan correctamente en tiempo de ejecución.
- **Detalle de las diferencias observadas (inspección de código):**
  1. **Esquemas de respuesta faltantes en OpenAPI:**
     - En `backend/src/routes/restaurante/mesa.routes.ts`, las anotaciones JSDoc OpenAPI para las respuestas 200/201 carecen de `content.application/json.schema`. Por lo tanto, herramientas de tipado automático como `openapi-typescript` generan `content?: never`.
  2. **Campos del request y respuestas de error omitidas:**
     - El schema de `requestBody` en `POST /api/mesas` omite el campo opcional `estado`.
     - No se documentan las respuestas de error esperadas (400, 401, 403, 404).
- **Resolución en frontend:**
  - El frontend utiliza contratos tipados explícitos en `Frontend/src/features/mesas/types.ts` (`Mesa`, `MesaResponse`, `MesasResponse`, etc.) para desacoplarse de la falta de schemas generados en OpenAPI y procesar el envoltorio `{ status: "success", data }`.
- **Criterio para cierre definitivo en backend:**
  - Incorporar componentes de schema para `Mesa` en OpenAPI, documentar el campo opcional `estado` en el alta y añadir los códigos de error estándar (400, 401, 403, 404).
- **Resolución definitiva:** se añadieron las definiciones completas de OpenAPI en `swagger.ts` (`Mesa`, `CreateMesaRequest`, `UpdateMesaRequest`, `MesaResponse`, `MesasResponse`), se documentó el campo opcional `estado` en el alta, y se enlazaron los esquemas de respuesta 200/201 y errores (400, 401, 403, 404) en `mesa.routes.ts`. Validado mediante pruebas unitarias (`openapi.test.ts`) y tipos TypeScript regenerados en `Frontend/src/api/generated/schema.ts`.
- **Estado:** resuelto.
