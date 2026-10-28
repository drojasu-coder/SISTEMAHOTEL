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

## BE-015 · Catálogo público de habitaciones

- **Categoría:** capacidad pública ausente; no es un defecto de autorización.
- **Fecha/revisión:** 2026-10-26, `refactor/backend-architecture`, HEAD `fd82605` y cambios locales existentes.
- **Flujo:** opción pública Habitaciones de la Ficha 1 UX.
- **Necesario:** consultar habitaciones/tipos y su sede sin sesión, mediante un contrato público explícito que no revele datos privados ni prometa disponibilidad sin fechas.
- **Actual/evidencia:** `backend/src/routes/habitaciones/habitacion.routes.ts` y `tipoHabitacion.routes.ts` exigen `authMiddleware` en sus lecturas. `/reservar` es el formulario de cliente autenticado; no existe catálogo público de habitaciones en el router anterior.
- **Frontend entregado:** `/habitaciones` explica el acceso al flujo existente, con ingreso o enlace a `/reservar` para clientes; no se presenta como catálogo ni se debilita autenticación. `/crear-reserva` queda como alias compatible de `/reservar`.
- **Siguiente acción:** acordar y autorizar por separado el contrato de catálogo público. Integrarlo solo cuando exista y verificar lectura anónima, aislamiento de datos y sede estable por resultado.
- **Estado:** pendiente de backend; criterio de catálogo público abierto.

## BE-016 · Normalización persistida de nombres de sedes

- **Categoría:** corrección de datos de presentación, sin migración ejecutada.
- **Fecha/revisión:** 2026-10-26, HEAD `fd82605` y cambios locales existentes.
- **Evidencia:** consulta GET de solo lectura a `/api/sucursales` local: ID 1 `Hotel Hunapú Antigua`, ciudad `Antigua Guatemala`; ID 2 `Hotel Hunahpú Atitlán`, ciudad `Panajachel`; ID 3 `Hotel Hunahpú Xela`, ciudad `Quetzaltenango`; ID 4 `Hotel Hunahpú Capital`, ciudad `Ciudad de Guatemala`.
- **Cambio necesario:** ID 1, nombre `Hotel Hunahpú Antigua`. Para ID 2, la presentación requerida es `Lago de Atitlán, Panajachel`; decidir si se guarda esa descripción en `ciudad` o se añade una ubicación de presentación manteniendo la ciudad geográfica.
- **Frontend:** `features/preferencias/sitePresentation.ts` normaliza de forma temporal solo pares ID/nombre verificados. Se conserva el ID real y no se modifican slugs, claves S3 ni datos administrativos. Registros desconocidos no se renombran por su índice.
- **Siguiente acción:** mantenimiento de datos autorizado fuera de esta ficha, con lectura posterior que confirme el nombre; decidir la semántica de ubicación de Atitlán antes de cambiar el campo persistido. Entonces revisar/eliminar únicamente el alias temporal que ya no sea necesario.
- **Estado:** pendiente de corrección de datos / decisión de ubicación. Normalización persistida NO completada.

## BE-017 · Contenido editorial público bilingüe

- **Categoría:** capacidad editorial ausente; propuesta de contrato, sin implementación ni migración en esta ficha.
- **Fecha/revisión:** 2026-10-26, `refactor/backend-architecture`, HEAD `fd82605` y árbol local compartido.
- **Flujos:** Inicio, sedes y descripciones de recursos públicos. La interfaz ES/EN ya puede cambiar sin recargar; el contenido comercial guardado solo tiene una versión.
- **Evidencia:** modelos `backend/src/models/{paginainicio,sucursal,tipohabitacion,amenidad,recursoactividad,serviciobienestar,salon}.js`, rutas/servicios públicos y `Frontend/src/api/generated/schema.ts`: campos únicos de título, descripción y texto alternativo; no hay campos ingleses ni asociaciones de traducciones. `hero_cta_enlace`, `fecha_entrada` y `expira_en` no son traducciones aunque coincidan con una búsqueda `_en`.
- **Actual:** el frontend conserva el español original con `lang="es"` dentro de páginas inglesas. Nombres propios, códigos y valores enum de solicitudes no se traducen. No se añadieron campos ficticios ni traducciones por ID.
- **Propuesta para el responsable de backend:** mantener los campos españoles actuales como fuente compatible y añadir versiones editoriales inglesas opcionales, inicialmente en `PaginaInicio` (títulos, subtítulos, textos, etiqueta CTA y alt; no enlaces ni claves S3) y en las descripciones/alt de los recursos. Alternativa normalizada: tablas Sequelize de traducciones por entidad con FK real, `locale` restringido y unicidad `(entidad_id, locale)`. Elegir una estrategia antes de implementar, sin combinar ambas.
- **Contrato propuesto:** DTO público con `traducciones: { en?: { descripcion?: string, ...campos editoriales permitidos } }`, conservando todos los campos actuales. No es todavía un tipo disponible. Validadores deben limitar claves, longitud y locale; textos vacíos equivalen a ausencia. El servidor entrega solo contenido aprobado. Campos operativos, precios, nombres oficiales, IDs y estados quedan fuera. Actualizar OpenAPI y regenerar tipos antes de consumir la extensión. Una migración futura debe ser reversible y no sobrescribir el español.
- **Criterios de desbloqueo:** contrato acordado, contenido inglés revisado/aprobado, lectura pública probada para español/inglés/faltantes, ausencia de traducciones borrador, preservación de consumidores actuales y pruebas de fallback. Integrar por campo y declarar idioma efectivo sin avisos técnicos al visitante.
- **Frontend pendiente:** consumir únicamente la extensión acordada cuando exista. No bloquea el cambio inmediato de idioma de la interfaz implementado en Ficha 2 A.
- **Estado:** pendiente de backend y aprobación editorial.

### BE-015 · Revisión para Ficha 3A (2026-10-26)

La lectura de las rutas y del servicio vigentes confirma que `GET /api/habitaciones`, `GET /api/habitaciones/:id`, `GET /api/tipos-habitacion` y `GET /api/habitaciones/disponibles` siguen bajo `authMiddleware`. No se elimina middleware ni se usan credenciales administrativas. **Búsqueda/catálogo/detalle anónimos: no desbloqueados.**

- **Integración disponible:** `/habitaciones` permite editar criterios públicamente; tras restaurar una sesión de cliente consulta catálogo y disponibilidad reales. `/habitaciones/:id` consulta la unidad real autenticada, conservando URL y sede real; sin sesión ofrece acceso con retorno interno y borrador mínimo. Se conservan `/reservar` y `/crear-reserva`.
- **Modelo:** unidad `Habitacion` con `habitacion_id`, `numero`, `sucursal_id` y FK a TipoHabitacion. No existe asignación de una unidad por grupo comercial: no se agrupa el producto reservable ni se elige la primera unidad automáticamente.
- **Contrato mínimo propuesto para José (NO implementado):** una lectura pública autorizada, por ejemplo `GET /api/public/habitaciones` y `GET /api/public/habitaciones/:id`, con DTO de unidad `{id, numero, sucursal_id, tipo_habitacion_id, Sucursal:{id,nombre}, TipoHabitacion:{id,nombre,capacidad_maxima,tarifa_noche,descripcion}, imagen_url, imagen_expires_at, imagen_creditos}`. La imagen debe mantener la identidad actual en backend y el mecanismo de resolución/renovación; no exponer claves privadas nuevas ni relaciones de reservas/usuarios. Debe acordarse si el catálogo es completo o paginado; si es paginado, incluir total y paginación explícitos para que frontend no filtre una página como catálogo completo.
- **Disponibilidad pública propuesta:** lectura pública que reutilice validación y servicio real de disponibilidad, con sede concreta, fechas y huéspedes; mismo DTO de unidades con `noches`, `tarifa_noche`, `total_estimado`. No cambia precios, impuestos, inventario ni reglas de reserva. Mantener creación autenticada y propiedad derivada del JWT. Definir controles de abuso adecuados a esa lectura antes de autorizarla. Actualizar OpenAPI y regenerar tipos al aprobar el contrato.
- **Todas las sedes:** el contrato actual exige sucursal_id. Frontend consulta las sedes reales con máximo dos solicitudes simultáneas, claves por usuario/criterios/sedes y errores parciales explícitos. No interpreta errores como ausencia general de inventario. Un futuro endpoint agregado solo debe sustituirlo después de documentarse.
- **Cierre verificable:** lectura anónima real autorizada y documentada, DTO seguro, pruebas públicas de catálogo/detalle/404/disponibilidad y aislamiento de datos privados; después integración anónima sin mocks. BE-015 permanece abierto.

## BE-018 · Datos ampliados de presentación y calendario de habitaciones

- **Categoría:** capacidades de contrato ausentes; sin migración ni datos inventados.
- **Fecha/revisión:** 2026-10-26, `refactor/backend-architecture`, HEAD `fd82605` y árbol local compartido.
- **Evidencia:** `backend/src/models/{habitacion,tipohabitacion}.js`, serialización en `services/habitaciones/habitacion.service.ts` y rutas vigentes. Hay capacidad, descripción del tipo y una imagen efectiva (unidad o fallback al tipo). No hay campos estructurados de camas, vista o características, ni colección ordenada de fotos de unidad, ni endpoint de disponibilidad diaria.
- **Frontend:** presenta solo los campos reales. Una única foto puede ampliarse con teclado/touch; no hay miniaturas falsas ni dos copias presentadas como galería. El calendario elige rangos; no pinta días ocupados a partir de una sola consulta. No se ofrecen filtros de vista ni promociones/precios tachados sin contrato.
- **Propuesta:** definir, si producto lo autoriza, metadatos estructurados y colección de referencias de medios realmente asociadas por unidad/tipo, con orden/alt/créditos y resolución de URLs por la capa actual. No asumir que la imagen genérica del tipo es una foto adicional de la unidad. Si se requiere calendario de inventario, definir un endpoint por unidad/sede y rango con granularidad, estados y actualización explícitos; una respuesta para un único rango no lo reemplaza.
- **Desbloqueo:** campos/relaciones reales, API/OpenAPI y contenido verificado; pruebas de asociaciones, orden, permisos y expiración. No bloquea el catálogo ni la consulta de rangos autenticados actuales.
- **Estado:** pendiente de backend/definición de producto para las capacidades ampliadas.

## BE-019 · Políticas de estancia y semántica fiscal publicables

- **Categoría:** decisión contractual/configuración pendiente; no se modifica lógica financiera.
- **Fecha/revisión:** 2026-10-26, mismo HEAD/árbol compartido.
- **Evidencia:** modelos/configuración, validadores de disponibilidad/reserva y servicios de habitaciones inspeccionados. No se encontró configuración publicable de horarios check-in/check-out ni máximo contractual de noches. La respuesta de disponibilidad incluye tarifa/noches/total estimado, sin promociones ni desglose fiscal. Configuracion tiene porcentaje_iva, pero eso no demuestra inclusión en tarifa_noche ni en todos los importes.
- **Necesario:** producto/backend deben definir horarios aprobados y fuente de configuración. El máximo propuesto de 30 noches **no está aprobado ni se implementa**. Si se acuerda un límite, debe validarse consistentemente en backend y documentarse, no solo restringirse en calendario.
- **Importes:** conservar valores actuales. Para publicar impuestos incluidos o un desglose se necesita un contrato explícito con semántica de cada importe y componentes calculados por backend. No dividir totales ni añadir IVA/INGUAT desde frontend. Mantener GTQ y Stripe; no nuevos métodos de pago.
- **Frontend:** omite horarios y políticas no aprobadas; muestra tarifa/noches/total estimado del servidor y convierte el total GTQ completo con MoneyReference. No aplica máximo nuevo ni muestra retención de 15 minutos.
- **Desbloqueo:** decisión aprobada, configuración/DTO de lectura documentado, pruebas y valores efectivos verificados. No se aplicó migración ni escritura en ninguna base.
- **Estado:** pendiente de decisión/contrato verificable.

## BE-020 · Recuperación y restablecimiento de contraseña

- **Categoría / estado:** función ausente; pendiente de backend (José).
- **Inspección:** 2026-10-26, base `fd82605`, rama `refactor/backend-architecture`, árbol compartido con cambios locales. `backend/src/routes/auth.routes.ts`, `controllers/auth.controller.ts`, `services/auth.service.ts`, `validators/auth.validator.ts`: solo register, login y me; no hay solicitud, validación/consumo de token de restablecimiento ni entrega de correo para este flujo.
- **Flujo afectado:** acceso público, Ficha 3B. Recuperación end-to-end **no completada**; no se muestra enlace ni formulario inoperante.
- **Necesario:** recuperación sin enumerar cuentas, entrega efectiva y tratamiento de token inválido, usado o vencido.
- **Propuesta para José (no implementada):** `POST /api/auth/password/forgot {email}` → 202 genérico «Si el correo existe, le enviaremos instrucciones», con respuesta indistinguible y rate limit; `POST /api/auth/password/reset {token,password}` → 200 sin JWT de sesión. Token aleatorio, hash en servidor, propósito exclusivo, vencimiento explícito, consumo único atómico; códigos documentados de inválido/usado/vencido y reglas de contraseña consistentes. Configurar proveedor de correo y URL de destino permitida, sin tokens en logs/telemetría. No aceptar destinos arbitrarios enviados por el cliente.
- **Desbloqueo verificable:** endpoints y OpenAPI, pruebas de enumeración/rate limit/reutilización/expiración y entrega de correo real en entorno de prueba. Luego integrar solicitud y nueva contraseña. El borrador es local a la pestaña/navegador original; no se promete continuidad entre dispositivos.

## BE-021 · Política de verificación de correo

- **Categoría / estado:** decisión pendiente de producto/backend (José).
- **Inspección:** misma revisión de BE-020. `models/usuario.js` no contiene correo verificado; el registro crea `cliente` activo y devuelve usuario sin token. Login separado devuelve JWT. No se encontraron endpoints de envío, reenvío o consumo de verificación.
- **Actual:** 3B conserva registro → login real separado; checkout mantiene la política vigente. No exige verificar correo para pagar.
- **Pendiente:** decidir si se necesita verificación y en qué operaciones. Si se aprueba, especificar estado persistido, caducidad, reenvío, entrega y autorización del servidor antes de integrar UI. No bloquea el login/registro actual.

## BE-022 · Textos legales aprobados y aceptación persistida

- **Categoría / estado:** decisión pendiente; capacidad de backend pendiente si se exige aceptación (José/producto).
- **Inspección:** misma revisión de BE-020; no se encontraron textos legales aprobados/rutas públicas en el repositorio. `registerSchema.strict()` acepta únicamente nombre, email, password y teléfono opcional; Usuario y servicio no guardan aceptación ni versión de términos.
- **Actual:** 3B no publica borradores legales, no añade enlaces rotos ni una casilla que finja persistencia.
- **Desbloqueo:** responsables deben proporcionar textos definitivos ES/EN, URLs/versiones y política de obligatoriedad. Si se exige consentimiento, acordar contrato y evidencia persistida por el servidor (versión aceptada, fecha de servidor y usuario), con validación y pruebas; integrar la casilla inicialmente desmarcada después. No recolectar ni descartar campos de aceptación en el cliente.

## BE-023 · Datos de esta compra y destinatario fiscal

- **Categoría / estado:** contrato ausente; pendiente de backend (José) y decisión del responsable de facturación.
- **Inspección:** 2026-10-26, base `fd82605`, rama `refactor/backend-architecture`, árbol compartido. `validators/pagos/pago.validator.ts` acepta origen, monto, método, tipo, moneda e idempotencia en esquema estricto. `validators/habitaciones/reservaHabitacion.validator.ts` acepta habitación, fechas y huéspedes; no destinatario ni datos de huésped. Usuario solo contiene nombre completo, email, teléfono y datos de autenticación. Factura sí tiene NIT/nombre/dirección fiscal, pero crear/modificar exige roles de facturación (`routes/habitaciones/factura.routes.ts`), sin vínculo de captura cliente para esta compra.
- **Flujo:** Ficha 3C. Se muestra contacto de la cuenta autenticada como lectura, sin actualizar el perfil ni simular guardado para la compra. El recorrido funcional sigue Carrito → Pago → Confirmación; el paso completo «Datos» queda pendiente y no bloquea el checkout.
- **Necesario:** acordar si la compra requiere destinatario, datos fiscales o huéspedes adicionales; definir mínimos, finalidad, propiedad, validación, almacenamiento por compra, retención de datos y distinción respecto del perfil. No solicitar documentos, NIT, residencia ni peticiones especiales sin destino persistente.
- **Propuesta, no implementada:** contrato autorizado de datos de compra asociado al carrito/orden y snapshot histórico vinculado al pago/factura, con edición permitida solo en estados acordados por backend. El servidor debe validar propietario y estados; ningún total fiscal ni propietario debe confiarse al cliente.
- **Desbloqueo:** contrato/OpenAPI y pruebas de persistencia, Unicode/límites, IDOR, cambio de cuenta y edición con compromiso financiero; requisitos fiscales aprobados por contabilidad. Luego integrar campos y paso Datos reales.

## BE-024 · Retención temporal de inventario y vencimiento del carrito

- **Categoría / estado:** comportamiento de retención ausente; pendiente de decisión/backend (José).
- **Evidencia:** `services/carrito/carrito.service.ts` calcula `expira_en` desde `CART_EXPIRATION_MINUTES` y `expireDueCarts` cambia únicamente Carrito a expirado. `services/carrito/carritoItem.service.ts` comprueba vigencia para mutaciones. No existe en este flujo una liberación de ReservaHabitacion vinculada al vencimiento del carrito. Las reservas pendientes tienen su propio ciclo; una columna de expiración del carrito no demuestra una retención de habitaciones.
- **Actual:** 3C muestra «Vence su carrito» desde la fecha del servidor, sin reiniciar minutos al visitar. Al cero y al volver a la pestaña realiza consultas; no cancela, borra ni libera inventario. Verifica intento/pago antes de presentar la recuperación de una compra vencida.
- **Pendiente:** si se aprueba retención real, especificar recurso/rango/capacidad retenidos, vencimiento autoritativo, liberación transaccional y tratamiento de PaymentIntent procesando o incierto; probar carreras y reconciliación antes de integrar. No se promete un plazo fijo de 15 minutos. Máximo de noches y políticas publicables siguen en BE-019.

## BE-025 · Validación del origen con identificación precisa del artículo

- **Categoría / estado:** contrato incompleto; pendiente de backend (José).
- **Evidencia:** `getResumenPago` → `validateOpenOrigin`/`cartTotals` en `services/pago.service.ts` valida propiedad/estado/exposición del origen y devuelve total/anticipo/aprobado/saldo. Errores como `CART_REFERENCE_NOT_AVAILABLE` no entregan consistentemente `carrito_item_id`, tipo y referencia fallida. `getAll` de carritoItem entrega artículos, promoción asociada y total, sin un informe de elegibilidad por artículo.
- **Actual:** se reutilizan esas validaciones. Las lecturas autorizadas por referencia muestran estado operativo, sin usar disponibilidad pública que excluiría la propia reserva, sin marcar otros artículos como inválidos y sin quitar ninguno automáticamente. Un error global no se atribuye a un artículo por conjetura.
- **Propuesta, no implementada:** respuesta de validación de carrito con errores tipados por ítem (ID/tipo/referencia/código/acciones permitidas) y versión/fecha de validación. Debe distinguir reserva propia, origen cancelado, cambio de importe y compromiso financiero, sin crear intentos. El cobro debe revalidar de forma transaccional aunque exista esta lectura.
- **Desbloqueo:** contrato y pruebas mixtas, propiedad, concurrencia y reserva propia; integrar acciones por ítem solo si están autorizadas. No se requiere ni se propone una búsqueda pública como sustituto.

## BE-026 · Comprobante válido, desglose histórico y correos de compra

- **Categoría / estado:** contrato/servicio ausentes para este recorrido; pendiente de backend (José) y responsable de facturación.
- **Evidencia:** `getPagoById` devuelve Pago autorizado, con monto/moneda/origen/estado, sin factura_id, desglose fiscal, documento descargable ni evidencia de entrega. Los artículos históricos se pueden leer por `/carritos/:id/items` incluso si el carrito está pagado/expirado, pero Pago no devuelve un snapshot fiscal de líneas. No se encontró descarga de recibo/factura ni servicio de entrega de correo en rutas/servicios inspeccionados. La existencia de Factura/FacturaItem o de un endpoint de lectura no demuestra emisión fiscal, descarga ni envío.
- **Actual:** resultado directo/recarga muestra el monto histórico del Pago y artículos de SU carrito, con referencias y lecturas de estado operativo separadas. No reconstruye importes desde catálogo actual. Permite copiar el ID y exportar un calendario local de habitación con fechas verificadas (no es comprobante fiscal). No muestra descarga de comprobante, aceptación fingida ni «Se envió un correo».
- **Pendiente fiscal:** asociación autorizada pago/orden/factura, líneas e impuestos históricos persistidos, fuente de documento válido y reglas de acceso/versionado. Reutilizar BE-019 para la semántica fiscal, sin inventar IVA/INGUAT ni cuadrar importes desde frontend. `promocion_id`/asociación Promocion en ítems no demuestra descuento aplicado: los totales actuales se leen del servidor, sin cupón, precio tachado ni segundo motor de importes.
- **Pendiente correo:** eventos de envío idempotentes después de confirmación del servidor, evidencia de aceptación/entrega/fallo, destinatario autorizado, idioma y plantillas aprobados; pruebas de reintentos sin duplicados. Nunca enviar desde render ni suponer idioma del correo por traducir la UI.
- **Desbloqueo:** contratos y pruebas verificables, aprobación de contabilidad y evidencia de entrega real en entorno autorizado. Descarga y confirmación de correo end-to-end siguen pendientes.

## BE-027 · Cambio de fechas de habitación por cliente

- **Categoría / estado:** operación cliente ausente; pendiente de backend/política (José).
- **Evidencia:** `PATCH /api/reservas-habitacion/:id` exige `rolesGestionHabitaciones`; el cliente no está incluido. El esquema de actualización existe para personal, no autoriza una edición desde el carrito del cliente.
- **Actual:** 3C no muestra «Cambiar fechas». Puede ofrecer «Nueva búsqueda con estas fechas», identificada como otra búsqueda que no modifica ni cancela la reserva original; no crea reservas al navegar y se oculta si la compra tiene compromiso/estado incierto.
- **Desbloqueo:** operación autorizada que valide propietario, disponibilidad excluyendo correctamente la reserva propia, importes/exposición financiera y estado permitido, con transacción y concurrencia. Contabilidad/producto deben acordar cancelación, penalizaciones y tratamiento de pagos antes de integrar cambios. No se aplica una propuesta de 48 horas ni primera noche como política definitiva.

## BE-028 · Datos y capacidades ampliadas de restaurante

- **Categoría / estado:** capacidades opcionales ausentes y decisiones de producto pendientes. No bloquean la reserva de una mesa real de Ficha 4B.
- **Fecha/revisión:** 2026-10-27, HEAD `eb7b16a` y cambios locales de 4A/4B inspeccionados.
- **Contrato comprobado:** `models/mesa.js`, `services/restaurante/mesa.service.ts` y `routes/restaurante/mesa.routes.ts`: GET público de mesas con `id`, `sucursal_id`, `zona`, `capacidad`, `estado`, `Sucursal.nombre`. Sucursal tiene `restaurante_imagen_key`; el catálogo de sedes publica la URL temporal y créditos propios del restaurante. Lectura local de API: 28 mesas, siete en cada una de cuatro sedes, cuatro fotos de restaurante. No se escribieron datos.
- **Reserva operativa:** `validators/restaurante/reservaMesa.validator.ts` y `services/restaurante/reservaMesa.service.ts`: POST estricto con mesa, fecha, hora y número entero positivo de comensales, propietario del JWT. Se crea `confirmada`; mantenimiento y exceso de capacidad bloquean. Colisión exclusivamente misma mesa/fecha/hora con otra confirmada, protegida por transacción y bloqueo de mesa. `ocupada` es estado físico, no impide una reserva futura. No existe consulta de horarios disponibles ni asignación automática. Las capacidades de mesas no se suman.
- **Presentación pendiente:** no hay entidad de restaurante independiente ni campos de descripción comercial, horarios de atención o destino de menú en estos contratos. Se muestran únicamente zona/capacidad/estado y foto específica existentes. No se habilitan «Ver menú», «Sin preferencia», horarios sugeridos ni intervalos calculados. Si producto requiere esas funciones, publicar datos y consultas verificables antes de integrarlas, manteniendo la unidad de reserva y reglas actuales.
- **Peticiones especiales:** `models/reservamesa.js` y el esquema estricto de creación no almacenan notas, alergias ni peticiones. No se solicitan. Para habilitarlas se requiere contrato, persistencia y pruebas de lectura/propiedad/límites, además de acordar el tratamiento de información sensible.
- **Llegada/cancelación:** no hay política publicable de tolerancia ni plazo de cancelación en los modelos/servicios de restaurante y Configuracion (solo IVA) inspeccionados. `PATCH /reservas-mesa/:id/estado` es exclusivo de admin; no hay cancelación de cliente. La aprobación/versionado de textos permanece en BE-022. No se publica tolerancia de 15 minutos ni se habilita cancelación de cliente.
- **Cobro:** este POST no devuelve importe ni crea carrito/pago. 4B conserva ese comportamiento y retira afirmaciones de gratuidad/anticipo sin política. No se deduce una política de precios de la ausencia de campos monetarios.
- **Recuperación:** las reservas propias se consultan en `GET /reservas-mesa/mis-reservas`. El frontend conserva un intento pendiente/incierto en la sesión, bloquea reenvío y permite una lectura nueva, recuperación de referencia coincidente o preparación explícita de otro envío tras revisar. Una lectura vacía no prueba que una petición anterior haya terminado. No hay idempotencia/reconciliación de creación por identificador de solicitud; esa garantía entre pestañas/dispositivos requeriría un contrato del servidor. No se inventa una clave de idempotencia.
- **Desbloqueo verificable de ampliaciones:** decisiones aprobadas, campos/endpoints documentados y pruebas de persistencia, autorización y concurrencia apropiadas; después integrar únicamente la capacidad respaldada. El flujo básico actual no depende de estas ampliaciones. Ficha 4C fuera del alcance.

## BE-029 · Datos de terapeutas y ampliaciones de Bienestar

**Actualización de integración comercial (2026-10-27):** se resolvió la falta de datos operativos descrita en el inventario inicial de esta entrada. Las lecturas reales de `hotel_db` por `:4000` entregan **21 servicios activos y 20 terapeutas activos**, distribuidos por `sucursal_id` entre Antigua (5/4), Atitlán (6/5), Xela (4/4) y Capital (6/7). Son registros existentes; esta verificación no los creó, modificó ni eliminó. Los servicios y terapeutas ahora tienen relación con sede; el servicio de creación rechaza `THERAPIST_BRANCH_MISMATCH`. El formulario público muestra la sede y únicamente terapeutas activos de la sede del servicio. Chromium verificó selección anónima, retorno del login con los campos preservados y preparación autenticada, sin enviar citas. Las afirmaciones históricas siguientes sobre ausencia de sede o terapeutas describen el estado inicial, no el entorno actual.

**Estado vigente:** datos operativos disponibles; ampliaciones opcionales, políticas y documentación OpenAPI pendientes. Sigue sin existir un endpoint de franjas libres ni asignación automática. Se conserva la hora deseada y el manejo del conflicto del servidor, con duración y descanso calculados por el backend. No se ejecutó una nueva cita ni su adición real al carrito: éxito, conflicto y recuperación se comprueban con pruebas focalizadas que simulan HTTP. No se declara verificado un guardado real de citas en esta continuación.

- **Categoría / estado vigente:** datos operativos disponibles; ampliaciones opcionales de contrato y política pendientes. No se modifica el backend en Ficha 4C.
- **Fecha/revisión:** 2026-10-27, HEAD `eb7b16a` y árbol de trabajo 4A/4B/4C.
- **Inventario inicial de Ficha 4C (histórico):** `models/{serviciobienestar,terapeuta,citabienestar}.js`, rutas/validadores/servicios en `bienestar`. Servicios: nombre, duración en minutos, DECIMAL precio y foto propia con URL temporal/créditos; sin sede, tipo, descripción, especialidad, recomendaciones ni contenido incluido. Terapeutas: nombre y activo. API pública local: cuatro servicios con fotografías y duraciones 45/50/60/75; precio serializado como cadena. `GET /terapeutas` respondió una colección vacía, no un error de conexión. No se crearon registros para completar la pantalla.
- **Dato operativo solicitado inicialmente (ya disponible):** un responsable debe registrar/activar terapeutas reales mediante la administración autorizada y comprobar `GET /terapeutas`. Hasta entonces el entorno local no permite crear citas desde el formulario: se informa de la falta de terapeutas y se bloquea el envío. No se anuncia próxima apertura. El contrato funcional sí existe; esto no demuestra una función ausente.
- **Reserva existente:** POST `/citas-spa` exclusivo de cliente, propietario del JWT, servicio/terapeuta/fecha/hora_inicio obligatorios y cuerpo estricto. Aunque la FK del modelo admite null, el contrato exige terapeuta real y activo. El servidor calcula hora_fin desde duración, bloquea la fila del terapeuta y valida traslapes/descanso bidireccional de 15 minutos, incluso alrededor de medianoche. Se conserva esa lógica; no se construye agenda alternativa. Sin endpoint de franjas libres ni asignación automática. Cambiar estado es administrativo y valida exposición financiera al cancelar.
- **Carrito/Stripe:** la cita se crea confirmada operativamente, sin campo de pago ni total histórico. `resolveBienestar` en `services/carrito/carritoItem.service.ts` comprueba propietario/estado/compromiso financiero y obtiene el precio del servicio en servidor. El frontend conserva ID por usuario/servicio, recupera por GET propio y permite reintentar solo la adición mediante el componente existente. Checkout/Stripe permanecen sin cambios. «Confirmada» y «añadida al carrito» no prueban pago.
- **OpenAPI incompleto:** el DTO generado marca muchos campos como opcionales, no documenta las relaciones de cita ni los medios y tipa precio únicamente como number. Se mantiene el tipo manual central en `features/bienestar/types.ts`, ampliado para DECIMAL string real; no se cambian esquemas generados a mano. Para retirar el suplemento, documentar respuestas reales/required/relaciones/medios/DECIMAL y regenerar contratos.
- **Política:** no se encontró fuente aprobada de cancelación/reembolso en los contratos de Bienestar, configuración vigente inspeccionada o registros previos. No publicar cancelación con dos horas ni promesas de reembolso. Reutilizar BE-022 para aprobación/versiones bilingües; mientras tanto se ofrece `/sedes`, que conserva el contacto real de sedes. El descanso de 15 minutos es una regla de conflicto, no una política de cancelación.
- **Ampliaciones opcionales:** si se requieren tipo, descripción, especialidades, recomendaciones, contenido incluido u horarios publicables, definir fuente y persistencia antes de mostrarlos. No derivarlos del nombre del tratamiento ni inventar beneficios médicos. Para disponibilidad, cualquier consulta debe reutilizar duración y descanso del servidor, sin cambiar la lógica actual de creación.
- **Recuperación y límites:** persistencia local mínima de solicitud pendiente o ID creado, sin precio, token ni imagen firmada. El ID no acredita la cita: se consulta el endpoint propio al reabrir. Una lectura vacía tras red incierta no prueba que la escritura terminara; preparar otro envío requiere revisión y confirmación explícitas. No se promete idempotencia entre dispositivos/pestañas; requeriría un identificador de solicitud y reconciliación del servidor.
- **Criterio inicial de cierre (ver actualización vigente anterior):** alta autorizada de terapeutas activos y comprobación del flujo con datos reales en entorno seguro; para cada ampliación opcional, contrato/documentación y pruebas de persistencia, propiedad y concurrencia antes de integrar. La creación y adición se prueban con API simulada; en el entorno real actual falta el dato operativo indicado.
