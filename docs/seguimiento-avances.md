# Seguimiento de Avances

Este documento registra de forma continua el avance técnico, archivos modificados, comandos ejecutados y bloqueos de cada tarea del encargo autónomo.

---

## Tarea 1: Completar lo posible de BE-014 (Pagos y Checkout)

- **Estado:** Completada la verificación de configuración y cobertura automatizada; comprobación interactiva en navegador detenida por bloqueo documentado.
- **Detalle de implementación / verificación:**
  - Verificada la configuración local sin revelar secretos: backend cuenta con `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` de prueba; frontend carece de `VITE_STRIPE_PUBLISHABLE_KEY`.
  - La presencia de `STRIPE_WEBHOOK_SECRET` no garantiza que el webhook local esté recibiéndose correctamente (se requiere reenvío activo mediante `stripe listen`).
  - Cobertura automatizada revisada con Vitest (`npm --prefix backend test tests/pagos/pago.intentoActivo.test.ts`): verificados todos los casos de resiliencia transaccional (rechazo de tarjeta, recuperación de intento, protección contra cobro incompatible ante éxito pendiente de webhook, aislamiento por usuario, desajuste de importe, fin de sondeo).
  - Estado de BE-014 mantenido en: *integración/verificación pendiente* hasta que se cuente con la clave pública de frontend, reenvío activo de webhooks y entorno interactivo.
- **Archivos relevantes:**
  - `docs/seguimiento-integracion-pagos.md`
  - `backend/tests/pagos/pago.intentoActivo.test.ts`
  - `Frontend/src/features/pagos/CheckoutPage.test.tsx`
  - `Frontend/src/features/pagos/PagoResultadoPage.test.tsx`
- **Bloqueos registrados:**
  - Falta `VITE_STRIPE_PUBLISHABLE_KEY` en `Frontend/.env` y navegador interactivo para ejecutar la verificación manual de Stripe Elements / 3DS.
- **Servicios activos:**
  - Contenedor Docker `hotel_postgres_test` en puerto `55432`.

---

## Tarea 2: Completar contratos pendientes existentes (BE-010 y BE-006)

- **Estado:** Completada y verificada.
- **Detalle de implementación / corrección:**
  - **BE-010 (Parqueos):** Se añadió el tag `Parqueos` y los esquemas canónicos `Parqueo`, `CreateParqueoRequest`, `UpdateParqueoRequest`, `ParqueoResponse`, `ParqueosResponse` y `ParqueoDeleteResponse` en `backend/src/docs/swagger.ts`. Se vincularon las referencias formales `$ref` en `backend/src/routes/habitaciones/parqueo.routes.ts` para respuestas 200, 201 y errores estandarizados (400, 401, 403, 404, 409).
  - **BE-006 (Sedes):** Se completaron los esquemas `Sucursal`, `CreateSucursalRequest`, `UpdateSucursalRequest`, `SucursalResponse` y `SucursalesResponse` con `required` explícito y soporte de nulabilidad fiel para campos opcionales (`direccion`, `ciudad`, `telefono`). Se corrigió en `backend/src/routes/sucursales/sucursal.routes.ts` el esquema envoltorio `{ status: "success", data }` con referencias formales `$ref`.
  - **Pruebas de contrato:** Se incorporaron 2 pruebas exhaustivas en `backend/tests/unit/openapi.test.ts` validando la presencia de esquemas, campos obligatorios, nulabilidad y enlaces `$ref` en los endpoints.
  - **Tipos generados:** Se ejecutó `npm --prefix Frontend run api:generate` regenerando `Frontend/src/api/generated/schema.ts` (95 paths procesados).
  - **Documentación de pendientes:** Se actualizaron `BE-006` y `BE-010` como resueltos con evidencia en `docs/pendientes-backend.md`.
- **Archivos relevantes:**
  - `backend/src/docs/swagger.ts`
  - `backend/src/routes/habitaciones/parqueo.routes.ts`
  - `backend/src/routes/sucursales/sucursal.routes.ts`
  - `backend/tests/unit/openapi.test.ts`
  - `Frontend/src/api/generated/schema.ts`
  - `docs/pendientes-backend.md`
- **Comandos ejecutados y resultados:**
  - `npm --prefix backend test tests/unit/openapi.test.ts`: 9/9 pruebas aprobadas.
  - `npm --prefix backend run test:unit`: 73/73 pruebas unitarias aprobadas.
  - `npm --prefix Frontend run api:generate`: Tipos generados correctamente.
  - `npm --prefix Frontend run typecheck`: TypeScript compiló sin errores.
  - `npm --prefix Frontend test`: 261 pruebas aprobadas en 26 archivos (1 archivo omitido por integración de red real).
- **Bloqueos:** Ninguno.

---

## Tarea 3: Consulta administrativa de reservas de habitación

- **Estado:** Completada y verificada.
- **Detalle de implementación:**
  - **Inspección de endpoints y permisos:** `GET /api/reservas-habitacion` y `GET /api/reservas-habitacion/:id` devuelven el catálogo completo para roles administrativos (`admin`, `recepcionista`, `gerente_habitaciones`) con relaciones `Usuario`, `Habitacion`, `TipoHabitacion` y `Sucursal`, sin paginación en servidor.
  - **Cliente HTTP y separación de claves:** Se añadió `reservasApi.getAllAdmin()` en `Frontend/src/features/reservas/api/reservasApi.ts`. Se definieron claves de consulta exclusivas `reservasAdminQueryKeys` parametrizadas por `userId` y filtros, totalmente desacopladas de las consultas de clientes ("Mis reservas").
  - **Pantallas y componentes creados:**
    - `Frontend/src/features/reservas/admin/types.ts`: Estados de filtro y claves de consulta administrativas.
    - `Frontend/src/features/reservas/admin/textos.ts`: Textos en español, trato de usted y nomenclatura formal.
    - `Frontend/src/features/reservas/admin/hooks/useAdminReservas.ts`: Hooks con TanStack React Query (`useAdminReservasQuery`, `useAdminReservaDetalleQuery`).
    - `Frontend/src/features/reservas/admin/components/AdminReservasFilters.tsx`: Filtros por búsqueda de texto (cliente, correo, habitación o identificador), sede hotelera y estado de reserva, con botón para restablecer y contador de coincidencias.
    - `Frontend/src/features/reservas/admin/components/AdminReservasList.tsx`: Cuadrícula responsiva con identificador, cliente, sede, habitación y tipo, fechas de estancia, duración en noches, cantidad de huéspedes, badge de estado (`ReservaEstadoBadge`), importe registrado en GTQ y botón de detalle.
    - `Frontend/src/pages/AdminReservasPage.tsx`: Vista principal de listado con carga (`LoadingNotice`), alerta de error con reintento, estado de catálogo vacío y estado de filtros sin coincidencias.
    - `Frontend/src/pages/AdminReservaDetallePage.tsx`: Vista de detalle individual accesible por URL directa (`/admin/reservas/:id`) y tras recarga, con datos completos del cliente, estancia, fechas, desglose financiero en GTQ y enlace de retorno.
  - **Enrutamiento y navegación:** Conectadas rutas `/admin/reservas` y `/admin/reservas/:id` bajo `RequireAuth` con permiso `habitaciones.gestionar` en `Frontend/src/app/router/AppRouter.tsx`. Añadido enlace de navegación cruzada en `Frontend/src/pages/HabitacionesPage.tsx`.
  - **Pruebas unitarias:** Creadas 7 pruebas unitarias completas en `Frontend/src/features/reservas/admin/AdminReservasPage.test.tsx` cubriendo renderizado de datos reales, filtros combinados, catálogo vacío, error con reintento, detalle por URL directa y manejo de reserva inexistente.
- **Archivos relevantes:**
  - `Frontend/src/features/reservas/api/reservasApi.ts`
  - `Frontend/src/features/reservas/admin/types.ts`
  - `Frontend/src/features/reservas/admin/textos.ts`
  - `Frontend/src/features/reservas/admin/hooks/useAdminReservas.ts`
  - `Frontend/src/features/reservas/admin/components/AdminReservasFilters.tsx`
  - `Frontend/src/features/reservas/admin/components/AdminReservasList.tsx`
  - `Frontend/src/features/reservas/admin/index.ts`
  - `Frontend/src/pages/AdminReservasPage.tsx`
  - `Frontend/src/pages/AdminReservaDetallePage.tsx`
  - `Frontend/src/pages/HabitacionesPage.tsx`
  - `Frontend/src/app/router/AppRouter.tsx`
  - `Frontend/src/features/reservas/admin/AdminReservasPage.test.tsx`
- **Comandos ejecutados y resultados:**
  - `npm --prefix Frontend test src/features/reservas/admin/AdminReservasPage.test.tsx`: 7/7 pruebas aprobadas.
  - `npm --prefix Frontend run typecheck`: 0 errores de tipado (código de salida 0).
  - `npm --prefix Frontend test`: 268 pruebas aprobadas en 27 archivos (1 archivo omitido por integración de red real).
- **Bloqueos:** Ninguno.

---

## Tarea 4: Revisión acotada de navegación

- **Estado:** Completada y verificada.
- **Detalle de auditoría y verificación:**
  - **Auditoría de enlaces y rutas internas:** Se inspeccionaron todas las etiquetas `<Link>` y `<NavLink>` en `Frontend/src/`. Todas las rutas de destino coinciden exactamente con rutas registradas y activas en `Frontend/src/app/router/AppRouter.tsx` (rutas públicas `/`, `/reservar`, `/mis-reservas`, `/mis-reservas/:id`, `/carrito`, `/checkout`, `/pagos/:id/resultado`, `/login`, `/registro`, `/cuenta`, y administrativas `/admin`, `/admin/habitaciones`, `/admin/reservas`, `/admin/reservas/:id`, `/admin/tipos-habitacion`, `/admin/parqueos`, `/admin/amenidades`, `/admin/restaurante`, `/admin/configuracion` con alias `/admin/sedes`). No existen enlaces rotos hacia rutas inexistentes.
  - **Accesibilidad desde navegación y subnavegación:**
    - Se constató que todas las pantallas implementadas son accesibles desde menús principales (`Navbar`, `AdminLayout` con `PANEL_MODULES`) o barras de subnavegación contextuales (en `HabitacionesPage` se conectan accesos directos hacia `Reservas` (`/admin/reservas`), `Tipos de habitación` (`/admin/tipos-habitacion`) y `Parqueos` (`/admin/parqueos`)).
  - **Enlaces de retorno en vistas profundas:**
    - `AdminReservaDetallePage` cuenta con enlace de retorno visible hacia `/admin/reservas`.
    - `DetalleReservaHabitacionPage` cuenta con enlace de retorno hacia `/mis-reservas`.
    - `CheckoutPage` cuenta con botón de retorno al carrito (`/carrito`).
    - `PagoResultadoPage` ofrece acciones de retorno a `/mis-reservas` y `/carrito`.
    - `AdminLayout` incluye enlace persistente "Volver al sitio" hacia `/`.
  - **Visibilidad y protección de acciones por rol:**
    - Acciones de mutación (crear/editar/eliminar) en habitaciones, tipos, amenidades, parqueos, mesas y sedes están estrictamente condicionadas a los permisos del usuario mediante `hasPermission(...)` (p. ej., `canManageHabitaciones`, `canManageTipos`, `canManageParqueos`, etc.). Los botones correspondientes no se renderizan para roles no autorizados.
    - Menús del panel (`PANEL_MODULES`) filtran dinámicamente las opciones según los roles autorizados por el backend en `getPanelModules(...)`.
- **Archivos relevantes:**
  - `Frontend/src/app/router/AppRouter.tsx`
  - `Frontend/src/layouts/AdminLayout.tsx`
  - `Frontend/src/layouts/GuestLayout.tsx`
  - `Frontend/src/components/shared/Navbar.tsx`
  - `Frontend/src/features/auth/permissions.ts`
  - `Frontend/src/pages/HabitacionesPage.tsx`
  - `Frontend/src/pages/AdminReservasPage.tsx`
  - `Frontend/src/pages/AdminReservaDetallePage.tsx`
- **Comandos ejecutados y resultados:**
  - `npm --prefix Frontend run typecheck`: 0 errores.
  - `npm --prefix Frontend test`: 268 pruebas aprobadas (27 archivos de test).
- **Bloqueos:** Ninguno para el alcance de navegación.

---

## Conciliación y Verificaciones Complementarias

- **Backlog y numeración de pendientes:**
  - Se aclara que los códigos `BE-007` (compatibilidad TypeScript) y `BE-008`/`BE-009` (validación y endpoints de mesas) corresponden a tareas históricas ya cerradas. No se reutilizan ni crean numeraciones inventadas.
  - El único pendiente abierto en `docs/pendientes-backend.md` es `BE-014` (*integración/verificación pendiente*), supeditado a la verificación interactiva en vivo con tarjeta de prueba y confirmación de recepción local del webhook.
  - Se reafirma que la mera presencia de claves de Stripe en `.env` no garantiza que el webhook local se esté recibiendo.
- **Rutas vigentes y aclaración de erratas de redacción:**
  - *Detalle de reserva cliente:* La ruta real configurada es `/mis-reservas/:id` (asociada a `DetalleReservaHabitacionPage`). La mención previa a `/mis-reservas/habitacion/:id` fue una errata de redacción.
  - *Restaurante y Mesas:* La ruta vigente en `PANEL_MODULES` y `AppRouter.tsx` es `/admin/restaurante` (que renderiza `MesasPage`). La ruta `/admin/mesas` no existe en el router ni es enlazada por ningún componente.
  - *Gestión de Sedes:* La ruta principal del panel es `/admin/configuracion` (módulo de configuración, permiso `configuracion.administrar`, renderiza `SedesPage`), disponiendo además del alias `/admin/sedes` en `AppRouter.tsx`.
- **Verificaciones con ejecutores nativos del proyecto:**
  - Suite de pagos ejecutada con Vitest: `npm --prefix backend test tests/pagos/pago.intentoActivo.test.ts` (10/10 pruebas pasando). Se subsana la errata de redacción que citaba Jest.
  - Verificación de tipos backend: `npm --prefix backend run typecheck:all` (0 errores).
  - Compilación de producción frontend: `npm --prefix Frontend run build` (0 errores, bundle generado en `Frontend/dist/`).
- **Prueba focalizada de acceso y aislamiento administrativo en reservas:**
  - Se creó y ejecutó la suite `backend/tests/habitaciones/reservaHabitacion.adminAccess.test.ts` contra `hotel_test_db`.
  - Se comprobó empíricamente que los tres roles contemplados en `habitaciones.gestionar` (`admin`, `recepcionista`, `gerente_habitaciones`) tienen acceso completo a listar todas las reservas y consultar el detalle de cualquier reserva por ID.
  - Se comprobó que el rol `cliente` únicamente puede listar sus propias reservas y recibe `403 INSUFFICIENT_PERMISSIONS` al intentar consultar una reserva ajena por ID.

---

## Tarea: Catálogo de Amenidades de Demostración y Gestión Administrativa de Reservas

- **Estado:** Completada e integrada en frontend y backend.
- **Detalle de implementaciones:**
  1. **Amenidades de demostración en `hotel_db:5432`:**
     - Destino efectivo comprobado con `SELECT current_database(), inet_server_port();` confirmando `hotel_db` en puerto interno `5432`.
     - Creación idempotente mediante capa de servicio de una amenidad por sede activa (4 sedes):
       - ID 1: "Área de descanso — Demostración" (Sede 1: Hotel Hunapú Antigua, aforo 15 personas).
       - ID 2: "Piscina y terraza — Demostración" (Sede 2: Hotel Hunahpú Atitlán, aforo 20 personas).
       - ID 3: "Gimnasio y sauna — Demostración" (Sede 3: Hotel Hunahpú Xela, aforo 10 personas).
       - ID 4: "Salón ejecutivo — Demostración" (Sede 4: Hotel Hunahpú Capital, aforo 25 personas).
     - Verificado mediante petición HTTP `GET http://localhost:4000/api/amenidades`.
  2. **Consulta y gestión administrativa de reservas de amenidades:**
     - **Backend:** Se incluyó el atributo `telefono` en el modelo `Usuario` en `backend/src/services/amenidades/reservaAmenidad.service.ts` y se documentó en Swagger (`backend/src/docs/swagger.ts`). Tipos OpenAPI regenerados para frontend (`schema.ts`).
     - **Frontend - Listado Administrativo (`/admin/reservas-amenidades`):**
       - Componente `AdminReservasAmenidadesList`: vista responsiva con tabla para pantallas medianas/grandes y tarjetas para pantallas móviles. Identificador, cliente (nombre y correo), amenidad, sede, fecha, horario, mobiliario, estado con badge visual y acciones operativas.
       - Filtros en tiempo real (`AdminReservasAmenidadesFilters`): búsqueda por ID/cliente/correo, selectores de sede, amenidad (vinculada a sede seleccionada), estado y fecha.
       - Manejo de estados: cargando, error con reintento, catálogo vacío y sin resultados tras filtrar.
     - **Frontend - Detalle Administrativo (`/admin/reservas-amenidades/:id`):**
       - Componente `AdminDetalleReservaAmenidad`: acceso directo por URL, información completa del cliente (incluyendo teléfono de contacto), datos de la amenidad, sede y aforo, franja horaria y mobiliario.
       - Pase de entrada y código de acceso real con `QRCodeSVG` y código textual.
       - Manejo de ID inválido, reserva inexistente (404) y acceso denegado (403), con botón de retorno al listado.
     - **Frontend - Acciones Administrativas:**
       - Endpoint integrado: `PATCH /api/reservas-amenidad/:id/estado` con `{ estado: 'usada' | 'cancelada' }`.
       - Confirmación accesible mediante diálogo modal antes de mutar el estado.
       - Bloqueo de acciones para reservas en estados terminales (`usada` o `cancelada`) informando la no modificabilidad.
       - Refresco automático de caché tras mutación (`queryClient.invalidateQueries`).
     - **Rutas y Permisos:**
       - Protegidas bajo permiso `servicios.administrar` en `AppRouter.tsx`.
       - Accesos visibles agregados desde `AmenidadesPage` y `ServiciosPage`.
       - Separación de query keys administrativas (`adminList`, `adminDetail`) respecto a las del cliente.
- **Comandos ejecutados y resultados:**
  - `npx vitest run src/features/amenidades`: 25/25 pruebas aprobadas (4/4 archivos de test).
  - `npm --prefix backend run typecheck`: 0 errores.
  - `npm --prefix Frontend run build`: compilación limpia en 9.37s.
  - Comprobación HTTP en vivo: `http://localhost:4000/api/amenidades` y `http://localhost:5173`.

---

## Cierre Integral del Módulo de Actividades Recreativas e Integración con Pagos

- **Estado:** Completada, verificada e integrada en frontend y backend.
- **Detalle de implementaciones y verificaciones:**
  1. **Gestión Administrativa de Recursos de Actividad e Instructores:**
     - **Endpoints y permisos:** Endpoints backend existentes (`/api/recursos-actividad`, `/api/instructores`) protegidos bajo permiso `servicios.administrar` (rol exclusivo `admin`).
     - **Catálogo de Recursos de Actividad (`/admin/recursos-actividad`):**
       - Componente `RecursosActividadList`: tarjetas con visualización de sede, tipo de actividad, identificador y tarifas en GTQ (`precio_hora`, `precio_equipo`, `precio_instructor_hora`).
       - Filtros en tiempo real (`RecursosActividadFilters`): búsqueda textual (nombre o tipo), selector de sede hotelera y selector de tipo de actividad.
       - Modal de creación/edición (`RecursoActividadFormModal`): validación de campos obligatorios, asignación de sede (en creación) y validación de tarifas no negativas.
       - Manejo de estados de carga, error con reintento, catálogo vacío y sin resultados tras filtrar.
     - **Catálogo de Instructores Deportivos (`/admin/instructores`):**
       - Componente `InstructoresList`: tarjetas con especialidad, estado (`activo` / `inactivo`) con badges visuales y acciones operativas de activación/desactivación.
       - Filtros en tiempo real (`InstructoresFilters`): búsqueda por nombre/especialidad y selector de estado.
       - Modal de creación/edición (`InstructorFormModal`): campos de nombre, especialidad y estado activo.
       - Manejo de conflictos de negocio del backend: captura limpia de `INSTRUCTOR_HAS_FUTURE_RESERVATIONS` (código HTTP 409) informando al usuario que no es posible desactivar un instructor con reservas futuras confirmadas.
       - Sin eliminación permanente física, respetando la integridad referencial y las reservas históricas.
     - **Navegación y Acceso:** Enlazados de forma visible desde el centro de administración de servicios (`ServiciosPage.tsx`) con rutas `/admin/recursos-actividad` y `/admin/instructores`.
  2. **Verificación y Alineación de la Fórmula de Precios:**
     - **Fórmula autoritativa del servidor:**
       - Inspección de `backend/src/services/actividades/reservaActividad.service.ts` (líneas 120-135) y la invariante de QA `QA-RA-FIN-CANDIDATE-001` (`qa/registry.yml`):
       - `duracionHoras = (timeToSeconds(horaFin) - timeToSeconds(horaInicio)) / 3600;`
       - `total = Math.round((Number(recurso.precio_hora) * duracionHoras + Number.EPSILON) * 100) / 100;`
       - El total persistido de la reserva se calcula estrictamente multiplicando la tarifa horaria del recurso (`precio_hora`) por la duración en horas, redondeado a dos decimales.
       - Los campos opcionales `precio_equipo` y `precio_instructor_hora` son tarifas informativas del recurso; la creación de reserva no agrega recargos adicionales al total de la reserva de actividad.
     - **Alineación en Frontend:**
       - En `ReservaActividadModal.tsx`, se removió la etiqueta engañosa `(+Q25.00)` del checkbox de equipo y se aclaró que el importe se calcula con la tarifa por hora del recurso y la duración seleccionada.
       - El frontend no envía campos inventados de precio al servidor y muestra el total devuelto por la API.
  3. **Cierre del Recorrido de Actividades hasta el Pago y Combinación de Carrito:**
     - **Enlace de referencia en carrito:** `CarritoItemCard.tsx` enlaza directamente a `/mis-reservas/actividades/${item.referencia_id}` cuando `tipo_item === "actividad"`.
     - **Invalidación de caché tras pago:** `usePagoResultado.ts` invalida las consultas de `["reservas-actividad"]` además de `["reservas-habitacion"]` para reflejar el estado tras el pago.
     - **Combinación de habitación y actividad en el mismo carrito:**
       - En `backend/src/services/pago.service.ts`, `roomExposureBalance` fue corregido para contabilizar la porción no perteneciente a habitaciones en el saldo disponible del carrito (`remaining = round(remaining + nonRoomCartTotal)`), permitiendo pagar carritos combinados con reservas de habitación y actividad sin disparar falsos positivos de `PAYMENT_EXCEEDS_BALANCE`.
       - Se verificó la coexistencia en un mismo carrito de ítems con el mismo ID numérico (`referencia_id: 1`) gracias a la clave discriminadora `tipo_item` (`habitacion` vs `actividad`).
  4. **Pruebas Automatizadas y Entornos:**
     - **Entorno aislado (puerto 55433):**
       - Se creó la prueba de integración `backend/tests/pagos/pagoActividadHabitacionCombinacion.test.ts` ejecutada contra `TEST_DATABASE_URL="postgres://hotel_test_user:hotel_test_password@127.0.0.1:55433/hotel_test_db"`.
       - Verificó creación de reserva de habitación, reserva de actividad, adición combinada al carrito, total conjunto de Q550.00, creación de pago procesando en Stripe simulado, recepción de webhook `payment_intent.succeeded`, persistencia de pago aprobado, carrito pagado, transición de habitación a confirmada, preservación del estado confirmado de actividad, e idempotencia ante repetición de webhook.
       - Se ejecutó la suite completa de pagos (`backend/tests/pagos/`): 15 archivos de prueba, 44 tests pasando (100%).
       - Se ejecutó la suite completa de actividades (`backend/tests/actividades/`): 5 archivos de prueba, 56 tests pasando (100%).
     - **Pruebas Frontend:**
       - 19 pruebas de actividades (`src/features/actividades/`): todas aprobadas.
       - Suite completa frontend (`npm test`): 38 suites pasando, 316 pruebas aprobadas (19 pruebas de red real omitidas).
       - Verificación de tipos backend (`npm run typecheck:all`): 0 errores.
       - Verificación de tipos frontend (`tsc --noEmit`): 0 errores.
       - Compilación de producción (`npm run build`): bundle generado correctamente en `Frontend/dist/`.
