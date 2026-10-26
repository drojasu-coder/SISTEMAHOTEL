# Informe Técnico de Avances Reales · Hotel Hunahpú

**Fecha de corte:** 23 de octubre de 2026, 11:33 hrs (UTC-6)  
**Carácter del informe:** Seguimiento técnico consolidado (incorporación de avances del coordinador hasta HEAD)  
**Rama activa de consulta:** `refactor/backend-architecture`  
**Commit de referencia (HEAD):** `36a2e75` (*test(reservas): verificar acceso y aislamiento administrativo y conciliar rutas y backlog*)  
**Estado de Git en el corte:** Rama local adelantada por 51 commits respecto a `origin/refactor/backend-architecture`; árbol de trabajo limpio en archivos bajo seguimiento de versión (únicamente archivos locales no rastreados: `.obsidian/`, `.tmp-shots/`, `.trash/`, `planificacion.zip`).

---

## 1. Resumen del Estado del Sistema

El sistema **Hotel Hunahpú** se encuentra en una etapa avanzada de integración vertical entre el frontend (React / Vite / TypeScript) y el backend refactorizado (Node.js / Express / Sequelize / PostgreSQL). Tras el corte provisional previo (fijado en el commit local `dbfff7b`), el coordinador y los equipos de desarrollo consolidaron los contratos OpenAPI pendientes de **Sedes** (`BE-006`) y **Parqueos** (`BE-010`), implementaron el módulo completo de **Consulta Administrativa de Reservas de Habitación** con soporte de filtros y detalle por URL directa, verificaron el control de acceso y aislamiento administrativo en backend contra la base de datos de pruebas, y auditaron la navegación y consistencia de rutas en el cliente.

Asimismo, los registros técnicos de seguimiento (`docs/seguimiento-avances.md` y `docs/seguimiento-integracion-pagos.md`), cuya ausencia se reportó como un hecho histórico en el corte anterior, ya se encuentran incorporados e inspeccionados en el repositorio.

El sistema **no se encuentra concluido en su totalidad**:
1. Para el módulo de pagos, el ítem **`BE-014` permanece en estado "integración/verificación pendiente"**. Si bien los contratos OpenAPI, el endpoint de recuperación autorizada de intento activo, la política estricta de idempotencia, las pantallas de checkout y las suites de pruebas automatizadas están completamente implementados, el criterio de cierre definitivo exige una comprobación interactiva en navegador real con Stripe Elements montado y la recepción real de eventos mediante Stripe CLI.
2. Continúan pendientes los flujos de autoservicio de cara al cliente para los módulos de restaurante (reserva de mesas), spa, eventos y boletos para el parque acuático, cuyas capacidades en backend existen de forma preliminar pero carecen aún de interfaces de cliente integradas al carrito de compras.

### Estado general por módulo

| Módulo | Estado | Evidencia | Pendiente |
| :--- | :--- | :--- | :--- |
| **Autenticación y Sesión** | Integrado y operativo | Inspeccionado en `backend/src/routes/auth.routes.ts` y `Frontend/src/features/auth/`. Pruebas de integración PostgreSQL y frontend pasando. `BE-001` cerrado en commit local `b2d3921`. | Ninguno para el alcance base (JWT en sessionStorage, login, registro y `/me`). |
| **Configuración y Sedes** | Integrado y documentado en OpenAPI | `BE-006` resuelto en commit local `e09c690`. Esquemas canónicos `Sucursal`, `SucursalResponse`, `SucursalesResponse` con nulabilidad fiel y envoltorio `{ status: "success", data }`. Pruebas en `openapi.test.ts` (9/9). Rutas `/admin/configuracion` y `/admin/sedes`. | Ninguno para la administración de sedes. |
| **Habitaciones y Tipos** | Integrado en Admin y Backend | Rutas `/admin/habitaciones` y `/admin/tipos-habitacion`. Pruebas de integración en `postgres.habitaciones.http.test.ts` y `postgres.tiposHabitacion.http.test.ts` sobre `hotel_test_db`. | Ninguno para el catálogo y administración de habitaciones. |
| **Mesas de Restaurante** | Integrado en Admin y Backend | `BE-008` y `BE-009` cerrados en commit local `f264854`. Ruta `/admin/restaurante` conectada. Pruebas HTTP en `postgres.mesas.http.test.ts`. | Flujo de reserva de mesas de cara al cliente en frontend. |
| **Amenidades** | Integrado en Admin y Backend | Ruta `/admin/amenidades` conectada en commit local `833cdee`. Pruebas en `postgres.amenidades.http.test.ts` sobre `hotel_test_db`. | Flujo de reserva de amenidades para clientes en frontend. |
| **Parqueos** | Integrado y documentado en OpenAPI | `BE-010` resuelto en commit local `e09c690`. Tag `Parqueos` y esquemas canónicos `Parqueo`, `CreateParqueoRequest`, `ParqueoResponse`, `ParqueosResponse`, etc. Vinculación `$ref` en rutas. Pruebas en `openapi.test.ts`. | Flujo de asignación o reserva directa por el cliente. |
| **Disponibilidad de Habitaciones** | Integrado y operativo | `BE-012` resuelto en commit local `6555138` (`GET /api/habitaciones/disponibles`). Validación de traslapes en fechas y cálculo de noches/tarifas en servidor. 25 pruebas en `disponibilidadHabitacion.test.ts`. | Ninguno en backend. |
| **Reservas de Clientes** | Integrado y operativo | `BE-011` resuelto. Rutas `/reservar`, `/mis-reservas` y `/mis-reservas/:id`. Pruebas unitarias de frontend (`CrearReservaPage.test.tsx`, `MisReservasPage.test.tsx`). | Ninguno para el flujo básico de reserva de habitación. |
| **Consulta Administrativa de Reservas** | Integrado y verificado | Implementado en commit local `cf8d62f`. Rutas `/admin/reservas` y `/admin/reservas/:id`. 7 pruebas en `AdminReservasPage.test.tsx` y prueba de aislamiento en `reservaHabitacion.adminAccess.test.ts` sobre `hotel_test_db`. | Acciones administrativas de mutación (cambio de estado o cancelación desde panel). |
| **Carrito de Compras** | Integrado y verificado | `BE-013` cerrado en commit local `ac537f2`. Ruta `/carrito` activa. `GET /actual` (consulta), `POST /carritos` (creación) y helper `getOrCreateActiveCart()`. 14 pruebas OpenAPI, 9 pruebas HTTP sobre `hotel_test_db`. | Ninguno para el alcance de compra de reservas de habitación. |
| **Checkout y Pagos con Stripe** | Integrado / Verificación en vivo pendiente | `BE-014` en estado parcial/integrado. Endpoint `GET /api/pagos/intento-activo`, contratos OpenAPI y tipos generados. 10 pruebas en `pago.intentoActivo.test.ts` con Vitest y 25 pruebas de pantallas de pago en frontend con mocks. | Comprobación interactiva en navegador real con tarjeta de prueba en vivo (`4242...`), `VITE_STRIPE_PUBLISHABLE_KEY` en `Frontend/.env` y recepción de webhook local vía Stripe CLI. |
| **Spa, Eventos, Transporte, Boletos** | Backend preliminar / Placeholder en Admin | Modelos y rutas backend existentes en `backend/src/routes/`. En frontend se muestran pantallas de reserva pendiente o `ModulePlaceholderPage`. | Esquematización OpenAPI, contratos tipados e implementación de vistas de cliente. |

---

## 2. Alcance Revisado y Commit de Referencia

- **Punto de sincronización:** Rama `refactor/backend-architecture`, commit local `36a2e75`.
- **Rango de commits inspeccionado:** Desde el inicio de la fase de contratos y pasarela (`58a606f`), pasando por el corte previo (`dbfff7b`), hasta los avances más recientes del coordinador (`a71a174`, `e09c690`, `cf8d62f`, `fa13a31` y `36a2e75`).
- **Estado de las fuentes técnicas consultadas:**
  - `docs/pendientes-backend.md`: **Disponible e inspeccionado**. Contiene el registro y criterio de cierre de `BE-006` (resuelto), `BE-010` (resuelto), `BE-013` (resuelto) y `BE-014` (integración/verificación pendiente).
  - `docs/seguimiento-avances.md`: **Disponible e inspeccionado**. Incorporado a partir del commit local `a71a174` y ampliado en commits subsecuentes. Registra en detalle la ejecución de las Tareas 1 a 4 del coordinador, comandos ejecutados y resultados de pruebas. *(Nota histórica: en el corte anterior en `dbfff7b` este archivo no existía en el árbol de trabajo).*
  - `docs/seguimiento-integracion-pagos.md`: **Disponible e inspeccionado**. Incorporado en el commit local `a71a174` y actualizado en `36a2e75`. Detalla la configuración verificada, la cobertura de resiliencia automatizada y las condiciones pendientes para el cierre interactivo de `BE-014`. *(Nota histórica: en el corte anterior en `dbfff7b` este archivo no existía en el árbol de trabajo).*
  - Código fuente en `backend/` y `Frontend/`: **Completamente accesible e inspeccionado**.

---

## 3. Funcionalidades Integradas y Rutas Disponibles

### A. Rutas del Frontend (`Frontend/src/app/router/AppRouter.tsx`)

#### 1. Rutas Públicas y de Cuenta
- `/`: Página principal (`HomePage`).
- `/login`: Formulario de inicio de sesión con validación Zod y gestión de tokens JWT (`LoginPage`).
- `/registro`: Formulario de alta para clientes (`RegisterPage`).
- `/cuenta`: Información de la cuenta autenticada (`AccountPage`, protegida por `RequireAuth`).
- `/forbidden` y `/403`: Pantalla informativa de accesos no autorizados (`ForbiddenPage`).

#### 2. Flujo de Huéspedes / Clientes
- `/reservar` (`RESERVAS_ROUTES.NUEVA`): Búsqueda de disponibilidad por fechas y sede consumiendo `GET /api/habitaciones/disponibles` y creación de reservas con `POST /api/reservas-habitacion` (`CrearReservaPage`).
- `/mis-reservas` (`RESERVAS_ROUTES.MIS_RESERVAS`): Consulta de reservas de habitación asociadas al usuario autenticado (`MisReservasPage`).
- `/mis-reservas/:id`: Detalle extendido de una reserva con botón integrado para agregarla al carrito de compras (`DetalleReservaHabitacionPage`). Se confirmó que la ruta vigente es `/mis-reservas/:id` y no la variante errónea citada en notas tempranas (`/mis-reservas/habitacion/:id`).
- `/carrito` (`CARRITO_ROUTES.CARRITO`): Visualización de reservas y actividades agregadas al carrito activo, lectura de subtotales devueltos por el backend, retiro de ítems vía `DELETE /api/carritos/:carritoId/items/:id` y enlace directo al checkout (`CarritoPage`).
- `/checkout` (`PAGOS_ROUTES.CHECKOUT`): Pasarela de pago protegida (`RequireAuth`). Valida que el usuario tenga rol `cliente`, consulta el saldo neto del servidor (`GET /api/pagos/resumen`), detecta intentos activos previos (`GET /api/pagos/intento-activo`), inicializa Stripe Elements (`PaymentElement`), gestiona claves de idempotencia seguras y ejecuta el cobro con tarjeta (`CheckoutPage`).
- `/pagos/:id/resultado`: Pantalla de confirmación y estado del pago (`PagoResultadoPage`). Soporta estados `aprobado`, `procesando` (con sondeo periódico), `rechazado` y `cancelado`, limpiando las claves de idempotencia locales únicamente cuando el cobro queda formalmente aprobado.

#### 3. Panel de Administración (`/admin` - Protegido por `RequireAuth panel`)
- `/admin`: Dashboard administrativo general (`AdminPage`).
- `/admin/configuracion` (con alias `/admin/sedes`): Gestión de sucursales y datos hoteleros (`SedesPage`, permiso `configuracion.administrar`).
- `/admin/habitaciones`: Catálogo de habitaciones físicas, números de piso y estados de mantenimiento (`HabitacionesPage`, permiso `habitaciones.gestionar`).
- `/admin/tipos-habitacion`: Tarifas base, capacidades máximas y descripciones de habitaciones (`TiposHabitacionPage`, permiso `habitaciones.gestionar`).
- `/admin/reservas` y `/admin/reservas/:id`: **Nuevo módulo administrativo** integrado en el commit local `cf8d62f`. Permite a roles autorizados (`admin`, `recepcionista`, `gerente_habitaciones`) listar todas las reservas del hotel con filtros por texto, sede y estado (`AdminReservasPage`), así como acceder al detalle exhaustivo por URL directa o recarga (`AdminReservaDetallePage`).
- `/admin/restaurante`: Configuración de mesas, capacidades y áreas de restaurante (`MesasPage`, permiso `restaurante.administrar`). Se verificó que la ruta activa en router y menú es `/admin/restaurante` (la ruta `/admin/mesas` no existe en el router).
- `/admin/amenidades`: Gestión de instalaciones y servicios complementarios (`AmenidadesPage`, permiso `servicios.administrar`).
- `/admin/parqueos`: Control de espacios de estacionamiento por sede (`ParqueosPage`, permiso `habitaciones.gestionar`).
- `/admin/servicios`: Panel de servicios generales (`ServiciosPage`, permiso `servicios.administrar`).
- Módulos adicionales en espera de implementación visual: Enlazan a `ModulePlaceholderPage` con control granular de permisos (eventos, personal, transporte, spa, proveedores y parque).

---

### B. Endpoints Relevantes del Backend (`backend/src/app.ts`)

#### 1. Autenticación y Usuarios
- `POST /api/auth/register`: Registro de nuevos usuarios con rol cliente por defecto.
- `POST /api/auth/login`: Autenticación con limitador de tasa (`authenticationRateLimiter`) retornando token JWT.
- `GET /api/auth/me`: Perfil del usuario autenticado con permisos y rol.
- `GET /api/usuarios`: Gestión administrativa de cuentas.

#### 2. Habitaciones y Reservas
- `GET /api/habitaciones/disponibles`: Búsqueda de disponibilidad en rango de fechas con validación estricta de traslapes en reservas pendientes/confirmadas y exclusión de habitaciones en mantenimiento (resuelve `BE-012`).
- `GET /api/habitaciones` y `GET /api/habitaciones/:id`: Consulta de habitaciones físicas.
- `GET /api/tipos-habitacion`: Catálogo de tipos de habitación.
- `POST /api/reservas-habitacion`: Creación transaccional de reserva de habitación para el cliente autenticado (resuelve `BE-011`).
- `GET /api/reservas-habitacion`: Listado de reservas. Aplica aislamiento automático: para clientes devuelve únicamente las propias; para roles administrativos (`admin`, `recepcionista`, `gerente_habitaciones`) devuelve el catálogo global completo.
- `GET /api/reservas-habitacion/:id`: Detalle de reserva incluyendo relaciones completas (`Usuario`, `Habitacion`, `TipoHabitacion`, `Sucursal`). Bloquea con `403 INSUFFICIENT_PERMISSIONS` si un cliente intenta consultar una reserva ajena.

#### 3. Carrito de Compras
- `GET /api/carritos`: Consulta de carritos (aislado por cliente para clientes; global para administradores).
- `GET /api/carritos/actual`: **Consulta estricta de solo lectura**. Retorna el carrito activo del usuario autenticado si existe y no ha expirado; si no posee un carrito activo vigente, retorna `404 Not Found`. **No crea carritos de forma colateral**.
- `POST /api/carritos`: **Creación explícita de un nuevo carrito activo**. Responde con `409 Conflict` (código `CART_ALREADY_ACTIVE`) si el usuario ya posee un carrito activo.
- `GET /api/carritos/:carritoId/items`: Listado de ítems dentro del carrito y cálculo dinámico de importe realizado en backend.
- `POST /api/carritos/:carritoId/items`: Inserción de ítems (valida que la referencia pertenezca al usuario, esté vigente y no se duplique).
- `DELETE /api/carritos/:carritoId/items/:id`: Retiro de un ítem del carrito conservando la reserva en base de datos.
- *Helper en cliente (`carritoApi.getOrCreateActiveCart`):* Función utilitaria de conveniencia en frontend (`Frontend/src/features/carrito/api/carritoApi.ts`) que consulta `GET /carritos/actual`; si recibe un `404`, invoca `POST /carritos`, y si se produce una colisión concurrente (`409 CART_ALREADY_ACTIVE`), reconsulta `GET /carritos/actual` para retornar el carrito creado en paralelo.

#### 4. Checkout, Pagos y Pasarela Stripe
- `GET /api/pagos/resumen`: Cálculo en el backend del balance financiero de un carrito o reserva (subtotal del origen, total pagado aprobado neto de reembolsos y saldo pendiente).
- `GET /api/pagos/intento-activo`: Consulta autorizada de solo lectura que sincroniza con la API de Stripe el estado de un PaymentIntent en curso para el carrito o reserva. Retorna `client_secret` únicamente si el estado en Stripe requiere método de pago o confirmación (`requires_payment_method`, `requires_confirmation`, `requires_action`) y habilita `puede_confirmar: true`. Si está en `processing`, `succeeded` o `canceled`, retorna `puede_confirmar: false` y `client_secret: null` (incorporado en `BE-014`).
- `POST /api/pagos`: Creación del registro de pago y del `PaymentIntent` en Stripe (modo test). Soporta replay seguro mediante encabezado/cuerpo de idempotencia sin duplicar cargos.
- `GET /api/pagos/:id`: Consulta del estado del pago con verificación estricta de propiedad.
- `POST /api/pagos/stripe/webhook`: Endpoint que recibe eventos externos de Stripe mediante lectura binaria cruda (`express.raw`), validando la firma criptográfica `Stripe-Signature` para asentar transiciones a `aprobado` y confirmar reservas/carritos asociados.
- `POST /api/pagos/:id/aprobar-transferencia`: Aprobación manual de transferencias bancarias reservada a roles directivos.
- `POST /api/pagos/:id/reembolso`: Procesamiento de reembolsos totales o parciales.

---

## 4. Cambios Relevantes y su Propósito Técnico

1. **Resolución de contratos OpenAPI en Sedes y Parqueos (`BE-006` y `BE-010` - Commit local `e09c690`):**
   - *Propósito:* Eliminar discrepancias de contrato y tipado manual en los módulos de configuración física del hotel.
   - *Detalle:* Se crearon en `backend/src/docs/swagger.ts` los esquemas canónicos de `Sucursal` (con `required` explícito y nulabilidad fiel en dirección, ciudad y teléfono) y `Parqueo` (con tag dedicado y esquemas envoltorio de respuesta y mutación). Se corrigió en `sucursal.routes.ts` el esquema envoltorio `{ status: "success", data }` con referencias formales `$ref`, y se regeneraron los tipos de TypeScript con `npm run api:generate` (procesando 95 paths).

2. **Implementación de consulta administrativa de reservas (`Tarea 3` - Commit local `cf8d62f`):**
   - *Propósito:* Proporcionar al personal administrativo del hotel (`admin`, `recepcionista`, `gerente_habitaciones`) la visibilidad integral del estado de ocupación y reservas, permitiendo búsquedas rápidas y auditoría de huéspedes.
   - *Detalle:* Se crearon componentes especializados (`AdminReservasFilters`, `AdminReservasList`), vistas dedicadas (`AdminReservasPage`, `AdminReservaDetallePage`) y hooks desacoplados (`useAdminReservasQuery`, `useAdminReservaDetalleQuery`) con claves de consulta (`reservasAdminQueryKeys`) parametrizadas por `userId` y filtros, evitando la mezcla de caché con las consultas privadas de los clientes.

3. **Verificación de control de acceso y aislamiento administrativo en reservas (Commit local `36a2e75`):**
   - *Propósito:* Garantizar que la apertura del catálogo de reservas a roles administrativos no comprometa el aislamiento de datos de los clientes.
   - *Detalle:* Se implementó la suite `backend/tests/habitaciones/reservaHabitacion.adminAccess.test.ts` contra la base de datos `hotel_test_db`, validando que los tres roles administrativos pueden listar y ver cualquier reserva, mientras que los clientes son confinados a sus propios registros y reciben `403 INSUFFICIENT_PERMISSIONS` ante cualquier intento de acceso a reservas ajenas.

4. **Auditoría acotada de navegación y permisos (`Tarea 4` - Commit local `fa13a31`):**
   - *Propósito:* Eliminar rutas huérfanas, inconsistencias de enlaces y renderizado indebido de controles administrativos.
   - *Detalle:* Se verificó la correspondencia 1:1 de todos los `<Link>` y `<NavLink>` en el frontend, la existencia de botones de retorno en vistas profundas y el condicionamiento estricto de botones de mutación mediante la función `hasPermission(...)`.

5. **Detección y recuperación condicionada de intentos de pago (`BE-014` - Commits locales `46f0a05`, `2aba4fb`, `c624604`):**
   - *Propósito:* Prevenir el bloqueo financiero del carrito ante interrupciones de red o recargas de pestaña, sin habilitar cobros dobles o montos discordantes.
   - *Detalle técnico:* `getIntentoActivo` detecta si existe un pago previo en estado no terminal. Si el intento en Stripe requiere confirmación y su importe coincide exactamente con el saldo del servidor, la pasarela de frontend reanuda el intento montando el formulario de Stripe Elements. Si el importe difiere o el estado en pasarela ya es terminal/cancelado, el sistema bloquea la acción impidiendo confirmar montos obsoletos.

---

## 5. Verificaciones Técnicas y Evidencias

En esta sección se reportan las comprobaciones disponibles, diferenciando entre resultados reportados, inspección de código y comprobaciones pendientes de ejecución interactiva.

### A. Pruebas Unitarias y de Componentes con Mocks
- **Frontend (268 pruebas unitarias aprobadas en 27 archivos de test):**
  - Ejecutadas con Vitest y `@testing-library/react` (`npm --prefix Frontend test`).
  - *Pagos y Checkout:* 25 pruebas unitarias con mocks de `@stripe/react-stripe-js` (17 pruebas en `CheckoutPage.test.tsx` y 8 pruebas en `PagoResultadoPage.test.tsx`), más 9 pruebas unitarias de persistencia y no colisión de claves en `idempotency.test.ts`.
  - *Consulta Administrativa de Reservas:* 7 pruebas unitarias en `AdminReservasPage.test.tsx` (renderizado de datos reales, filtros combinados por texto/sede/estado, estado vacío, reintento tras error y detalle por URL directa).
  - *Otras suites de frontend:* Pruebas de componentes de carrito (`CarritoPage.test.tsx`, `BotonAnadirAlCarrito.test.tsx`), autenticación (`LoginForm.test.tsx`, `RegisterForm.test.tsx`, `RequireAuth.test.tsx`), navegación y módulos administrativos (`SedesPage`, `HabitacionesPage`, `TiposHabitacionPage`, `MesasPage`, `AmenidadesPage`, `ParqueosPage`).
  - *Nota sobre conteos:* Las 7 pruebas de reservas administrativas se integraron al conteo global, pasando de 261 a 268 pruebas en total. No se deben sumar suites individuales sobre el total global.
- **Backend Unitario (73 pruebas unitarias aprobadas):**
  - Ejecutadas mediante `npm --prefix backend run test:unit`.
  - Incluye las 9 pruebas de contrato OpenAPI en `backend/tests/unit/openapi.test.ts` (esquemas de pagos, reservas, sedes y parqueos), 14 pruebas en `openapi.carrito.test.ts`, validadores (`auth`, `mesa`, `reservation-payment`), aislamiento de pagos (`payment-ownership.test.ts`) y servicio Stripe mockeado (`stripe.service.test.ts`).

### B. Pruebas HTTP e Integración contra PostgreSQL (`hotel_test_db`)
- **Reportado en documentación técnica y commits:**
  - Todas las pruebas de integración del backend se ejecutan contra la base de datos real PostgreSQL denominada `hotel_test_db` en el puerto `55432`.
  - **Aislamiento y acceso administrativo (`reservaHabitacion.adminAccess.test.ts`):** Suite focalizada añadida en el commit local `36a2e75`, comprobando experimentalmente la matriz de acceso entre roles administrativos y clientes.
  - **Resiliencia de pagos (`pago.intentoActivo.test.ts`):** 10 pruebas pasando mediante Vitest (`npm --prefix backend test tests/pagos/pago.intentoActivo.test.ts`), verificando rechazo de tarjeta, recuperación de intento, protección contra cobro incompatible ante éxito pendiente de webhook, aislamiento por usuario y desajuste de importe.
  - **Concurrencia de pagos (`pago.idempotency.concurrency.test.ts`):** 20 peticiones concurrentes de replay idempotente garantizando unicidad y convergencia en base de datos.
  - **Carrito HTTP (`postgres.carrito.http.test.ts`):** 9 pruebas HTTP pasando (creación, listado, colisión 409, referencia ajena 403, duplicado 409 y retiro 204 conservando la reserva).
  - **Disponibilidad de Habitaciones (`disponibilidadHabitacion.test.ts`):** 25 pruebas HTTP cubriendo traslapes de fechas, exclusión de mantenimiento y cálculo de importes.
  - **Suites HTTP adicionales sobre PostgreSQL:** `postgres.habitaciones.http.test.ts`, `postgres.tiposHabitacion.http.test.ts`, `postgres.mesas.http.test.ts`, `postgres.amenidades.http.test.ts`, `postgres.parqueos.http.test.ts`, `postgres.sucursales.http.test.ts`.

### C. Webhooks Simulados
- **Inspeccionado en código:**
  - El backend implementa `POST /api/pagos/stripe/webhook` con `express.raw()` para verificar el encabezado `Stripe-Signature`.
  - En las pruebas de backend (`backend/tests/pagos/pagoWebhookRefundReplay.test.ts`), se simula la llegada de eventos firmados verificando transiciones de estado a `aprobado` y confirmación de la reserva/carrito.
  - En las pruebas frontend de `PagoResultadoPage.test.tsx`, la recepción del webhook se simula haciendo que el endpoint de consulta retorne `estado: "aprobado"` tras el ciclo de sondeo.

### D. Stripe en Modo de Prueba (Test Mode)
- **Inspeccionado en código y configuración:**
  - Backend configurado con `STRIPE_SECRET_KEY` de prueba (`sk_test_...`) y `STRIPE_WEBHOOK_SECRET` (`whsec_...`).
  - Frontend configurado con singleton `getStripe()` (`Frontend/src/features/pagos/utils/stripe.ts`) que requiere `env.stripePublishableKey` (`VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`).
- **Pendiente de comprobación:**
  - Falta la ejecución manual interactiva en un navegador real con una tarjeta de prueba de Stripe (ej. `4242 4242...`) contra los servidores de Stripe en tiempo real desde el formulario de la aplicación.

### E. Verificación Visual en Navegador
- **Pendiente de comprobación:**
  - Las validaciones visuales del frontend han sido ejecutadas bajo el entorno emulado JSDOM en Vitest.
  - Falta la comprobación interactiva en navegador web real con backend (`http://localhost:4000`) y frontend (`http://localhost:5173`) activos, validando el renderizado de Tailwind CSS, el montaje del iframe de Stripe Elements y la adaptabilidad responsive de las tarjetas.

### F. Typecheck y Build
- **Inspeccionado en comandos y código:**
  - `npm --prefix backend run typecheck:all`: 0 errores de tipado en TypeScript.
  - `npm --prefix Frontend run typecheck`: 0 errores de tipado en TypeScript.
  - `npm --prefix Frontend run build`: Compilación exitosa de producción (bundle generado en `Frontend/dist/`).
  - Archivo de contratos `Frontend/src/api/generated/schema.ts` sincronizado con los 95 paths de la API de backend.

---

## 6. Pendientes Técnicos, Discrepancias y Bloqueos

### A. Compromisos Contractuales y Criterios de Cierre Pendientes
1. **Cierre definitivo de `BE-014` (Bloqueo no crítico / Verificación final):**
   - *Condición de cierre:* Realizar la prueba interactiva completa en navegador con pasarela en modo test (`sk_test_...` / `pk_test_...`), completando el formulario de Stripe Elements y recibiendo la confirmación del webhook local.
   - *Bloqueo actual:* Falta configurar `VITE_STRIPE_PUBLISHABLE_KEY` en `Frontend/.env` y disponer de una sesión con navegador gráfico interactivo para superar los desafíos 3DS de prueba.

2. **Módulos de Cliente Pendientes de Implementación:**
   - *Restaurante (Mesas):* El backend está operativo (`/api/mesas`, `/api/reservas-mesa`) y el panel de administración está integrado (`/admin/restaurante`), pero no existe una vista para que el cliente reserve mesas ni las agregue al carrito.
   - *Spa, Eventos, Transporte y Parque Acuático:* Modelos y rutas backend en estado preliminar; faltan contratos OpenAPI formales, tipado en frontend y pantallas de autoservicio.

### B. Discrepancias Técnicas Pendientes de Aclaración
1. **Puerto del reenvío de webhooks de Stripe:**
   - En `docs/seguimiento-integracion-pagos.md` el coordinador registró el comando `stripe listen --forward-to localhost:3000/api/pagos/stripe/webhook`. Sin embargo, en `planificacion/GUIA-PRUEBAS-PAGOS.md` y en la configuración habitual de `backend/.env`, el puerto del backend es `4000`. Se señala esta discrepancia como un ítem pendiente de confirmación en el entorno local antes de iniciar el reenvío de webhooks.

### C. Propuestas de Mejora Técnica (Fuera de Compromisos Actuales)
- Incorporación de acciones de mutación administrativa directa (cambio de estado manual o cancelación) desde la vista `AdminReservaDetallePage`.
- Implementación de paginación en servidor para `GET /api/reservas-habitacion` cuando el volumen histórico de reservas crezca.

---

## 7. Próximos Pasos Recomendados

1. **Paso 1 · Verificación en vivo de Stripe (Cierre formal de `BE-014`):**
   - Configurar `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` en `Frontend/.env`.
   - Confirmar el puerto del backend e iniciar Stripe CLI:  
     `stripe listen --forward-to localhost:4000/api/pagos/stripe/webhook` (o puerto `3000` si se ajusta `PORT`).
   - Iniciar backend (`http://localhost:4000`) contra `hotel_test_db` y frontend (`http://localhost:5173`).
   - Iniciar sesión como cliente, seleccionar una habitación disponible en `/reservar`, añadirla al carrito, avanzar a `/checkout` e ingresar una tarjeta de prueba de Stripe (`4242...`).
   - Confirmar la recepción del evento `payment_intent.succeeded` en el webhook y la redirección a `/pagos/:id/resultado` mostrando el estado **Aprobado**.
   - Actualizar `docs/pendientes-backend.md` cambiando el estado de `BE-014` a **resuelto**.

2. **Paso 2 · Módulo de Cliente para Reservas de Restaurante:**
   - Crear la pantalla de autoservicio para consulta de mesas disponibles y reserva (`/restaurante/reservar`).
   - Conectar la acción de "Añadir al Carrito" utilizando `POST /api/carritos/:carritoId/items` con `tipo_item: "mesa"`.

3. **Paso 3 · Esquematización OpenAPI y Frontend de Servicios Restantes:**
   - Documentar contratos OpenAPI para Spa (`citas-spa`), Eventos (`reservas-evento`) y Parque Acuático (`boletos-parque`), regenerando tipos antes de iniciar el desarrollo de interfaz.

---

## 8. Referencias a Archivos y Commits Clave

### Commits Principales (Historial Local)
- `36a2e75` · *test(reservas): verificar acceso y aislamiento administrativo y conciliar rutas y backlog* (HEAD)
- `fa13a31` · *docs(navegacion): documentar revision acotada de navegacion y permisos para Tarea 4*
- `cf8d62f` · *feat(reservas-admin): implementar consulta administrativa de reservas, filtros, detalle por URL y pruebas*
- `e09c690` · *feat(contratos): documentar contratos OpenAPI y resolver BE-010 y BE-006 con pruebas y tipos generados*
- `a71a174` · *docs(pagos): registrar estado y verificacion de Tarea 1 para BE-014*
- `dbfff7b` · *docs: actualizar estado de BE-014 a integracion/verificacion pendiente*
- `c624604` · *feat(frontend-pagos): integracion de CheckoutPage, PagoResultadoPage, rutas y enlace desde carrito*
- `46f0a05` · *feat(backend-pagos): recuperacion autorizada de intento activo, contratos OpenAPI y tipos generados BE-014*
- `2aba4fb` · *feat(pagos): contratos discriminados de intento activo y politica estricta de idempotencia*
- `d6d90fb` · *feat(pagos): dependencias stripe, singleton getStripe, helper idempotencia, intento activo y BE-014*
- `58a606f` · *feat(pagos): base compartida de tipos, cliente api, queryKeys, rutas y registro BE-014*
- `ac537f2` · *docs: cerrar BE-013 tras verificacion e integracion completa de carrito*
- `a3ee034` · *feat(carrito): habilitar adicion de reserva al carrito, ruta /carrito y navegacion del cliente*
- `0de8f83` · *feat(backend): documentar esquemas y rutas de carrito en OpenAPI y validar HTTP en hotel_test_db (BE-013)*
- `6555138` · *feat(reservas): habilitar rutas, navegacion cliente y tipado OpenAPI generado para reservas (BE-011, BE-012)*
- `7e3fc42` · *feat(parqueos): conectar ruta /admin/parqueos, navegacion cruzada, i18n, pruebas HTTP y registro BE-010*
- `f264854` · *docs(backend): cerrar pendientes BE-008 y BE-009 y regenerar tipos OpenAPI del frontend*
- `b2d3921` · *feat(auth): integrar esquemas OpenAPI de autenticacion en frontend y cerrar BE-001*

### Archivos de Backend Relevantes
- `backend/src/app.ts`: Configuración de Express, middlewares y montaje de rutas.
- `backend/src/routes/pagos/pago.routes.ts`: Documentación OpenAPI y enrutamiento de pagos y checkout.
- `backend/src/services/pago.service.ts`: Lógica de negocio de pagos, balances y `getIntentoActivo`.
- `backend/src/routes/sucursales/sucursal.routes.ts`: Contratos y rutas de sucursales con envoltorio `{ status: "success", data }`.
- `backend/src/routes/habitaciones/parqueo.routes.ts`: Contratos y rutas de gestión de espacios de parqueo.
- `backend/src/docs/swagger.ts`: Esquemas de OpenAPI para pagos, carritos, reservas, sedes, parqueos y autenticación.
- `backend/tests/habitaciones/reservaHabitacion.adminAccess.test.ts`: Pruebas de integración sobre `hotel_test_db` para control de acceso administrativo.
- `backend/tests/pagos/pago.intentoActivo.test.ts`: Pruebas de resiliencia y recuperación de intento activo ejecutadas con Vitest.
- `backend/tests/unit/openapi.test.ts`: Suite unitaria de contratos OpenAPI (9/9 pruebas aprobadas).

### Archivos de Frontend Relevantes
- `Frontend/src/app/router/AppRouter.tsx`: Enrutador central con definición de rutas públicas, cliente y administración.
- `Frontend/src/pages/AdminReservasPage.tsx`: Vista administrativa de catálogo de reservas con filtros combinados.
- `Frontend/src/pages/AdminReservaDetallePage.tsx`: Vista administrativa profunda de detalle de reserva.
- `Frontend/src/features/reservas/admin/AdminReservasPage.test.tsx`: Suite de 7 pruebas unitarias del módulo de administración de reservas.
- `Frontend/src/pages/CheckoutPage.tsx`: Vista principal de checkout con pasarela Stripe Elements.
- `Frontend/src/pages/PagoResultadoPage.tsx`: Vista de confirmación de pago con sondeo reactivo.
- `Frontend/src/pages/CarritoPage.tsx`: Vista del carrito de compras.
- `Frontend/src/features/carrito/api/carritoApi.ts`: Cliente HTTP del carrito con helper `getOrCreateActiveCart()`.
- `Frontend/src/features/pagos/utils/idempotency.ts`: Mecanismo estricto de generación y preservación de claves de idempotencia.
- `Frontend/src/features/pagos/utils/stripe.ts`: Singleton para inicialización asíncrona de Stripe.js.
- `Frontend/src/api/generated/schema.ts`: Definición TypeScript de los 95 paths de OpenAPI sincronizados.

### Registros Técnicos Consultados
- `docs/pendientes-backend.md`: Registro oficial de tareas backend (`BE-006`, `BE-010`, `BE-013` resueltos; `BE-014` pendiente de verificación interactiva).
- `docs/seguimiento-avances.md`: Bitácora continua del coordinador detallando avances, comandos y resultados de Tareas 1 a 4 y conciliación.
- `docs/seguimiento-integracion-pagos.md`: Registro técnico del estado de la pasarela Stripe y condiciones de prueba.
- `planificacion/GUIA-PRUEBAS-PAGOS.md`: Guía de pruebas de pasarela y configuración local con Stripe CLI.
- `planificacion/refactorizacion/FASE-5H-CIERRE-FINAL.md`: Registro de línea base de la arquitectura backend previa al frontend.
