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
  2. Faltaban componentes dedicados para las respuestas estándar envueltas: `CarritoResponse`, `CarritosResponse`, `CarritoItemsResponse` y `CarritoItemResponse`.
  3. En `backend/src/routes/carrito/carrito.routes.ts` y `backend/src/routes/carrito/carritoItem.routes.ts`, algunas anotaciones no vinculaban los esquemas envoltorio completos o no documentaban los esquemas de error estandarizados (400, 401, 403, 404, 409, 422).
- **Criterio para cierre definitivo en backend:**
  - Declarar listas `required` explícitas en `Carrito`, `CarritoItem` y `CarritoItemsData` en `swagger.ts` con soporte de `nullable` real para campos nulos (`expira_en`, `descripcion`, `promocion_id`).
  - Crear esquemas `CarritoResponse`, `CarritosResponse`, `CarritoItemsResponse`, `CarritoItemResponse` y `CreateCarritoItemRequest` en `components.schemas``.
  - Vincular las referencias en `carrito.routes.ts` y `carritoItem.routes.ts` para respuestas 200, 201, 204 y errores.
  - Verificar con pruebas unitarias de OpenAPI, pruebas HTTP contra `hotel_test_db` y regenerar los tipos en `Frontend/src/api/generated/schema.ts`.
- **Resolución definitiva:** Esquemas (`Carrito`, `CarritoItem`, `CarritoItemsData`, `CreateCarritoItemRequest`, `CarritoResponse`, `CarritosResponse`, `CarritoItemsResponse`, `CarritoItemResponse`) documentados con `required` explícito y `nullable` real en `swagger.ts` y rutas. Validado con 14 pruebas OpenAPI, 9 pruebas HTTP sobre `hotel_test_db` (crear, listar, colisión 409, referencia ajena 403, duplicado 409 y retiro 204 conservando reserva), tipos regenerados en `schema.ts`, adición integrada en confirmación/detalle de reservas y ruta `/carrito` activada para clientes.
- **Estado:** resuelto.

## BE-014 · Documentación OpenAPI, esquemas de contrato y recuperación de intento activo en pagos

- **Categoría:** mejora de documentación / contrato OpenAPI y recuperación funcional de pagos
- **Revisión inspeccionada:** 2026-10-24 · `refactor/backend-architecture`
- **Flujo afectado:** operaciones de checkout y pagos (`/api/pagos`, `/api/pagos/intento-activo`, `/api/pagos/resumen`, `/api/pagos/:id`, `/api/pagos/stripe/webhook`).
- **Estado de funcionamiento:** las operaciones del backend funcionan correctamente en tiempo de ejecución: `POST /api/pagos` crea los pagos y PaymentIntents de Stripe, valida propiedad del origen y unicidad de idempotencia con replay seguro si se reenvía la misma clave; `GET /api/pagos/resumen` calcula importes y saldos; `GET /api/pagos/:id` consulta el estado garantizando aislamiento de usuario; y el webhook de Stripe confirma transiciones hacia `aprobado`, `pagado` y `confirmada`. Se reconcilian y cancelan automáticamente intentos pendientes de carritos expirados protegiendo contra cobros huérfanos o incompatibles.
- **Detalle de las diferencias observadas:**
  1. En `backend/src/docs/swagger.ts`, no existían esquemas para `Pago`, `ResumenPagoData`, `CreatePagoRequest`, `PagoCreatedData`, `PagoCreatedResponse`, `ResumenPagoResponse` ni `PagoResponse`.
  2. En `backend/src/routes/pagos/pago.routes.ts`, los endpoints empleaban ejemplos planos (`example:`) en lugar de referencias formales (`$ref: '#/components/schemas/...'`).
  3. Recuperación autorizada de intento en curso y reconciliación de intentos huérfanos: se requería un flujo seguro para recuperar intentos activos sin crear cobros duplicados ni dejar intentos abiertos en Stripe cuando expiran carritos previos.
- **Criterio para cierre definitivo en backend:**
  - Implementar `GET /api/pagos/intento-activo?carrito_id=X` con verificación de propiedad del carrito, consulta de PaymentIntent en Stripe y sincronización de estado sin escrituras en GET.
  - Declarar esquemas canónicos `Pago`, `ResumenPagoData`, `CreatePagoRequest`, `PagoCreatedData`, `PagoCreatedResponse`, `ResumenPagoResponse` y `PagoResponse` en `backend/src/docs/swagger.ts`.
  - Vincular las referencias `$ref` en `pago.routes.ts` para respuestas 200, 201 y esquemas de error (400, 401, 403, 404, 409, 422).
  - Verificar con pruebas de esquema OpenAPI y pruebas HTTP contra `hotel_test_db`.
  - Regenerar tipos en `Frontend/src/api/generated/schema.ts`.
  - Validar los flujos de pago en Stripe en modo prueba (éxito directo, rechazo y recuperación en caliente, autenticación 3D Secure, y cancelación de intentos huérfanos).
- **Resolución definitiva:**
  - **Contratos y API:** Endpoint `GET /api/pagos/intento-activo`, esquemas canónicos en `swagger.ts`, anotaciones `$ref` en `pago.routes.ts`, tipos TypeScript regenerados en `schema.ts`.
  - **Evidencia verificada:**
    1. *Pruebas manuales con evidencia real en vivo (Stripe testmode y PostgreSQL `hotel_test_db:55432`):*
       - **Pago exitoso directo:** Pago 3, Carrito 4, Reserva 4 por GTQ 450.00 (`pi_3UTnNoLtJcRjbnjR14NWkZJn`). Aprobado con tarjeta regular Visa `4242`.
       - **Rechazo y recuperación sobre el mismo PaymentIntent:** Reserva 3, Carrito 9, Pago 7 por GTQ 300.00 (`pi_3UTzjZLtJcRjbnjR1LINBYWW`). Rechazo inicial con tarjeta declinada terminada en `0002` persistido como `rechazado` en BD (`codigo_error_externo: 'card_declined'`), y posterior aprobación inmediata en el mismo intento con tarjeta `4242` sin recargar ni alterar sesión. Webhook recibido con HTTP 200: Pago 7 `aprobado`, Carrito 9 `pagado` y Reserva 3 `confirmada`.
       - **Autenticación 3D Secure (SCA):** Reserva 5, Carrito 10, Pago 8 por GTQ 450.00 (`pi_3UTzujLtJcRjbnjR15GIBrMT`). Tarjeta `4000 0027 6000 3184` activó `authentication_flow: challenge` (`payment_intent.requires_action`). Tras completar la autenticación interactiva en el modal de Stripe, `result: authenticated` (`payment_intent.succeeded` y `charge.succeeded`), persistiendo Pago 8 `aprobado`, Carrito 10 `pagado` y Reserva 5 `confirmada`.
       - **Cancelación de intento huérfano de carrito expirado:** El intento anterior de Pago 4 / Carrito 5 expirado (`pi_3UTnQqLtJcRjbnjR0dARZc3p`) fue reconciliado y cancelado limpiamente en Stripe y BD (`estado = 'cancelado'`) al iniciar el pago de Carrito 9, evitando cobros huérfanos e incompatibilidades de saldo.
       - **Auditoría de compras:** Cero cobros duplicados en las operaciones registradas.
    2. *Comprobaciones mediante API:* Endpoint `GET /api/pagos/intento-activo`, cálculo financiero de `GET /api/pagos/resumen` y procesamiento de webhook Express preservando raw body en `/api/pagos/stripe/webhook`.
    3. *Pruebas automatizadas (mocks y concurrencia):*
       - Suites focalizadas `pago.reconcileMetadata.test.ts` (11/11 pasando) y `pago.intentoActivo.test.ts` (10/10 pasando).
       - Protección contra doble envío e idempotencia transaccional en `pago.idempotency.concurrency.test.ts`.
       - Cobertura de recarga y recuperación de interfaz en `Frontend/src/features/pagos/CheckoutPage.test.tsx` (17/17 pasando).
  - **Base de datos:** Migración `20261022000000-enforce-reserva-habitacion-integrity.js` aplicada formalmente en `hotel_test_db:55432` con respaldo previo (`hotel_test_db_pre_migration_20261024_0145.dump`). `hotel_db:5432` permanece sin tocar.
- **Estado:** resuelto.
