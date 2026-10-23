## BE-006 · Documentación OpenAPI en sucursales y convención de envoltorio

- **Categoría:** mejora de documentación / contrato OpenAPI
- **Revisión inspeccionada:** 2026-10-22 · `refactor/backend-architecture`
- **Flujo afectado:** catálogo y gestión de sedes (`/api/sucursales`, `/api/sucursales/:id`).
- **Estado de funcionamiento:** las operaciones del módulo (`GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`) funcionan correctamente en tiempo de ejecución.
- **Detalle de las diferencias observadas:**
  1. En `backend/src/docs/swagger.ts`, el esquema `Sucursal` carecía de `required` explícito y `nullable: true` para campos opcionales (`direccion`, `ciudad`, `telefono`).
  2. Faltaban los esquemas envoltorio `SucursalResponse` y `SucursalesResponse` con el formato real `{ status: "success", data }`.
  3. En `backend/src/routes/sucursales/sucursal.routes.ts`, `GET /` documentaba erróneamente un envoltorio `{ success: true, data }` y las mutaciones carecían de referencias formales `$ref` o respuestas de error completas (400, 401, 403, 404, 409).
- **Criterio para cierre definitivo en backend:**
  - Declarar `required: ["id", "nombre", "activa", "createdAt", "updatedAt"]` y `nullable: true` en `Sucursal` en `swagger.ts`.
  - Crear esquemas `SucursalResponse` y `SucursalesResponse` en `components.schemas`.
  - Vincular las referencias `$ref` en `sucursal.routes.ts` para respuestas 200, 201, 204 y esquemas de error (400, 401, 403, 404, 409).
  - Verificar con pruebas unitarias de OpenAPI y regenerar los tipos en `Frontend/src/api/generated/schema.ts`.
- **Resolución definitiva:** Esquemas (`Sucursal`, `CreateSucursalRequest`, `UpdateSucursalRequest`, `SucursalResponse`, `SucursalesResponse`) documentados con `required` explícito, nulabilidad fiel y referencias `$ref` en rutas. Validado mediante suite `openapi.test.ts` (9/9 pruebas pasando), tipos TypeScript regenerados en `schema.ts`, y suite de frontend (261 pruebas pasando).
- **Estado:** resuelto.

## BE-010 · Documentación OpenAPI en endpoints de parqueos

- **Categoría:** mejora de documentación / contrato OpenAPI
- **Revisión inspeccionada:** 2026-10-22 · `refactor/backend-architecture`
- **Flujo afectado:** catálogo y gestión de espacios de parqueo (`/api/parqueos`, `/api/parqueos/:id`).
- **Estado de funcionamiento:** las operaciones del módulo (`GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`) funcionan correctamente en tiempo de ejecución garantizando aislamiento y restricciones de integridad.
- **Detalle de las diferencias observadas:**
  1. En `backend/src/docs/swagger.ts`, no existían esquemas canónicos para `Parqueo`, `CreateParqueoRequest`, `UpdateParqueoRequest`, `ParqueoResponse`, `ParqueosResponse` ni `ParqueoDeleteResponse`, ni el tag `Parqueos`.
  2. En `backend/src/routes/habitaciones/parqueo.routes.ts`, las anotaciones carecían de `content.application/json.schema` en respuestas exitosas (200, 201).
- **Criterio para cierre definitivo en backend:**
  - Declarar tag `Parqueos` y esquemas canónicos `Parqueo`, `CreateParqueoRequest`, `UpdateParqueoRequest`, `ParqueoResponse`, `ParqueosResponse` y `ParqueoDeleteResponse` en `swagger.ts`.
  - Vincular las referencias `$ref` en `parqueo.routes.ts` para respuestas 200, 201 y códigos de error (400, 401, 403, 404, 409).
  - Verificar con pruebas unitarias de OpenAPI y regenerar los tipos en `Frontend/src/api/generated/schema.ts`.
- **Resolución definitiva:** Tag y esquemas (`Parqueo`, `CreateParqueoRequest`, `UpdateParqueoRequest`, `ParqueoResponse`, `ParqueosResponse`, `ParqueoDeleteResponse`) definidos en `swagger.ts` y vinculados en `parqueo.routes.ts`. Verificado mediante suite `openapi.test.ts` (9/9 pruebas pasando), tipos regenerados en `schema.ts`, y pruebas de frontend (261 pruebas pasando).
- **Estado:** resuelto.

## BE-013 · Documentación OpenAPI en endpoints de carrito y carritoItems

- **Categoría:** mejora de documentación / contrato OpenAPI
- **Revisión inspeccionada:** 2026-10-22 · `0de8f83`
- **Flujo afectado:** operaciones del carrito de compras y sus ítems (`/api/carritos`, `/api/carritos/actual`, `/api/carritos/:id`, `/api/carritos/:carritoId/items`).
- **Estado de funcionamiento:** las operaciones del backend funcionan correctamente en tiempo de ejecución, asegurando transaccionalidad, aislamiento de usuario, unicidad de carrito activo y prevención de duplicados o referencias ajenas.
- **Detalle de las diferencias observadas:**
  1. En `backend/src/docs/swagger.ts`, los esquemas `Carrito`, `CarritoItem` y `CarritoItemsData` carecían de listas `required` explícitas para campos obligatorios no nulos, provocando que herramientas de tipado automático (`openapi-typescript`) generaran todos los campos como opcionales en el cliente.
  2. Faltaban componentes dedicados para las respuestas estándar envueltas: `CarritoResponse`, `CarritoItemsResponse` y `CarritoItemResponse`.
  3. En `backend/src/routes/carrito/carrito.routes.ts` y `backend/src/routes/carrito/carritoItem.routes.ts`, algunas anotaciones no vinculaban los esquemas envoltorio completos o no documentaban los esquemas de error estandarizados (400, 401, 403, 404, 409, 422).
- **Criterio para cierre definitivo en backend:**
  - Declarar listas `required` explícitas en `Carrito`, `CarritoItem` y `CarritoItemsData` en `swagger.ts` con soporte de `nullable` real para campos nulos (`expira_en`, `descripcion`, `promocion_id`).
  - Crear esquemas `CarritoResponse`, `CarritosResponse`, `CarritoItemsResponse`, `CarritoItemResponse` y `CreateCarritoItemRequest` en `components.schemas`.
  - Vincular las referencias en `carrito.routes.ts` y `carritoItem.routes.ts` para respuestas 200, 201, 204 y errores.
  - Verificar con pruebas unitarias de OpenAPI, pruebas HTTP contra `hotel_test_db` y regenerar los tipos en `Frontend/src/api/generated/schema.ts`.
- **Resolución definitiva:** Esquemas (`Carrito`, `CarritoItem`, `CarritoItemsData`, `CreateCarritoItemRequest`, `CarritoResponse`, `CarritosResponse`, `CarritoItemsResponse`, `CarritoItemResponse`) documentados con `required` explícito y `nullable` real en `swagger.ts` y rutas. Validado con 14 pruebas OpenAPI, 9 pruebas HTTP sobre `hotel_test_db` (crear, listar, colisión 409, referencia ajena 403, duplicado 409 y retiro 204 conservando reserva), tipos regenerados en `schema.ts`, adición integrada en confirmación/detalle de reservas y ruta `/carrito` activada para clientes.
- **Estado:** resuelto.

## BE-014 · Documentación OpenAPI, esquemas de contrato y recuperación de intento activo en pagos

- **Categoría:** mejora de documentación / contrato OpenAPI y recuperación funcional de pagos
- **Revisión inspeccionada:** 2026-10-22 · `58a606f`
- **Flujo afectado:** operaciones de checkout y pagos (`/api/pagos`, `/api/pagos/intento-activo`, `/api/pagos/resumen`, `/api/pagos/:id`, `/api/pagos/stripe/webhook`).
- **Estado de funcionamiento:** las operaciones del backend funcionan correctamente en tiempo de ejecución: `POST /api/pagos` crea los pagos y PaymentIntents de Stripe, valida propiedad del origen y unicidad de idempotencia con replay seguro si se reenvía la misma clave; `GET /api/pagos/resumen` calcula importes y saldos; `GET /api/pagos/:id` consulta el estado garantizando aislamiento de usuario; y el webhook de Stripe confirma transiciones hacia `aprobado`, `pagado` y `confirmada`.
- **Detalle de las diferencias observadas:**
  1. En `backend/src/docs/swagger.ts`, no existían esquemas para `Pago`, `ResumenPagoData`, `CreatePagoRequest`, `PagoCreatedData`, `PagoCreatedResponse`, `ResumenPagoResponse` ni `PagoResponse`.
  2. En `backend/src/routes/pagos/pago.routes.ts`, los endpoints empleaban ejemplos planos (`example:`) en lugar de referencias formales (`$ref: '#/components/schemas/...'`).
  3. Recuperación autorizada de intento en curso: si el cliente pierde su clave de idempotencia o ingresa desde una sesión distinta mientras existe un pago en estado `procesando` con tarjeta, un nuevo intento lanza `409 PAYMENT_EXCEEDS_BALANCE` porque la capacidad financiera queda reservada.
- **Criterio para cierre definitivo en backend:**
  - Implementar `GET /api/pagos/intento-activo?carrito_id=X` con verificación de propiedad del carrito, consulta de PaymentIntent en Stripe y sincronización de estado sin escrituras en GET.
  - Declarar esquemas canónicos `Pago`, `ResumenPagoData`, `CreatePagoRequest`, `PagoCreatedData`, `PagoCreatedResponse`, `ResumenPagoResponse` y `PagoResponse` en `backend/src/docs/swagger.ts`.
  - Vincular las referencias `$ref` en `pago.routes.ts` para respuestas 200, 201 y esquemas de error (400, 401, 403, 404, 409, 422).
  - Verificar con pruebas de esquema OpenAPI y pruebas HTTP contra `hotel_test_db`.
  - Regenerar tipos en `Frontend/src/api/generated/schema.ts`.
- **Resolución parcial:** Implementado endpoint de recuperación de intento activo y conciliación de cancelaciones en `pago.service.ts` y rutas; esquemas OpenAPI documentados en `swagger.ts` y rutas; 17 pruebas de integración HTTP sobre `hotel_test_db` pasando (incluyendo 20 replays concurrentes, recuperación de intentos y reconciliación de cancelaciones conservando aprobaciones concurrentes); tipos regenerados en `schema.ts`. Integradas pantallas `CheckoutPage` y `PagoResultadoPage` en frontend con 25 pruebas unitarias passing. Pendiente la comprobación interactiva en navegador con tarjeta de prueba en vivo y recepción de webhook local.
- **Estado:** integración/verificación pendiente.
