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
  1. En `backend/src/docs/swagger.ts`, no existen esquemas para `Pago`, `ResumenPagoData`, `CreatePagoRequest`, `PagoCreatedData`, `PagoCreatedResponse`, `ResumenPagoResponse` ni `PagoResponse`.
  2. En `backend/src/routes/pagos/pago.routes.ts`, los endpoints emplean ejemplos planos (`example:`) en lugar de referencias formales (`$ref: '#/components/schemas/...'`).
  3. Recuperación autorizada de intento en curso: si el cliente pierde su clave de idempotencia o ingresa desde una sesión distinta mientras existe un pago en estado `procesando` con tarjeta, un nuevo intento lanza `409 PAYMENT_EXCEEDS_BALANCE` porque la capacidad financiera queda reservada. Se requiere un endpoint formal `GET /api/pagos/intento-activo?carrito_id=X` que permita recuperar el `client_secret` fresco de Stripe si sigue activo, o transicionar localmente a `cancelado` si en Stripe el intento expiró/fue cancelado.
- **Criterio para cierre definitivo en backend:**
  - Implementar `GET /api/pagos/intento-activo?carrito_id=X` con verificación de propiedad del carrito, consulta de PaymentIntent en Stripe y sincronización de estado.
  - Declarar esquemas canónicos `Pago`, `ResumenPagoData`, `CreatePagoRequest`, `PagoCreatedData`, `PagoCreatedResponse`, `ResumenPagoResponse` y `PagoResponse` en `backend/src/docs/swagger.ts`.
  - Vincular las referencias `$ref` en `pago.routes.ts` para respuestas 200, 201 y esquemas de error (400, 401, 403, 404, 409, 422).
  - Verificar con pruebas de esquema OpenAPI y pruebas HTTP contra `hotel_test_db`.
  - Regenerar tipos en `Frontend/src/api/generated/schema.ts`.
- **Parte del frontend que queda pendiente:**
  - El frontend utiliza tipos manuales centralizados en `Frontend/src/features/pagos/types.ts` y cliente HTTP preparado en `Frontend/src/features/pagos/api/pagosApi.ts`.
- **Estado:** backend disponible / integración pendiente.
