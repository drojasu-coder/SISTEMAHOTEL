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
    - Menús del panel (`PANEL_MODULES`) filtran dinámicamente las opciones según los roles autorizados por el backend en `getPanelModules(...)`.\
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

---

## Implementación e Integración Completa del Módulo de Bienestar y Spa (HOTEL HUNAHPÚ)

- **Estado:** Completada, verificada e integrada en frontend y backend.
- **Detalle de implementaciones y verificaciones:**
  1. **Contrato Real de Bienestar e Integración con Backend:**
     - **Servicios de Bienestar (`ServicioBienestar`):** Catálogo con `nombre`, `duracion_minutos` y `precio` en GTQ.
     - **Terapeutas (`Terapeuta`):** Registro de profesionales con estado operativo `activo` (booleano).
     - **Citas de Bienestar (`CitaBienestar`):** Citas con `usuario_id`, `servicio_bienestar_id`, `terapeuta_id`, `fecha`, `hora_inicio`, `hora_fin` y estado operativo (`confirmada`, `cancelada`, `completada`).
     - **Reglas de negocio y disponibilidad:**
       - El terapeuta debe existir y encontrarse activo (`422 THERAPIST_INACTIVE`).
       - La duración se calcula autoritativamente en el servidor a partir de `duracion_minutos` del servicio, determinando `hora_fin`.
       - **Regla rigurosa de descanso de 15 minutos en ambos sentidos:** Se exige un buffer simétrico y bidireccional de 15 minutos de descanso entre sesiones del mismo profesional:
         $$\text{candStartMs} < \text{bufferEndMs} \quad \land \quad \text{candEndMs} > \text{bufferStartMs}$$
         donde $\text{bufferStartMs} = \text{startMs} - 15\text{ min}$ y $\text{bufferEndMs} = \text{endMs} + 15\text{ min}$.
         Aplica sin sesgo de orden de inserción, no restringe falsamente la búsqueda a un único día calendario (cubriendo cruces de medianoche entre fechas adyacentes) y se ejecuta bajo transacción con bloqueo exclusivo de fila (`lock: transaction.LOCK.UPDATE`) sobre el terapeuta, serializando reservas concurrentes.
       - Citas canceladas no bloquean nuevas reservas.
       - Terapeutas distintos no se bloquean mutuamente en el mismo intervalo.
       - Reactivación administrativa a `confirmada` revalida la disponibilidad y el buffer del profesional asignado, excluyendo la propia cita de los conflictos (`[Op.ne]: id`).
     - **Nuevos endpoints cliente implementados:**
       - `GET /api/citas-spa/mis-reservas`: Lista exclusivamente las citas del cliente autenticado.
       - `GET /api/citas-spa/mis-reservas/:id`: Consulta individual con verificación estricta de propiedad (403 `FORBIDDEN` para otros clientes).
     - **OpenAPI y tipos de frontend:**
       - Especificación OpenAPI documentada con tags, parámetros, respuestas y esquemas canónicos (`CitaBienestar`, `CreateCitaBienestarRequest`, `UpdateCitaBienestarEstadoRequest`).
       - Regeneración de tipos TypeScript en `Frontend/src/api/generated/schema.ts` (102 paths procesados, 193 operaciones).
  2. **Catálogo y Creación de Reservas de Spa (Cliente):**
     - **Catálogo de Bienestar (`/bienestar`):**
       - Componente `CatalogoBienestarList`: cuadrícula de tratamientos con duración en minutos, tarifas en quetzales (`formatearGTQ`) y barra de búsqueda en tiempo real.
       - Estados de carga con esqueleto visual, error con reintento y estado vacío.
     - **Modal de Reserva (`ReservaCitaModal`):**
       - Identidad del cliente tomada de la sesión autenticada; no se permite inyectar `usuario_id`, `total` ni `estado`.
       - Selector de terapeutas filtrado únicamente por profesionales activos (`activo: true`).
       - Validación de fecha mínima (hoy) y formato 24h para hora de inicio (`reservaCitaSchema` con Zod).
       - Desactivación de envíos duplicados durante el procesamiento.
       - Manejo amigable de conflictos de disponibilidad y buffer de 15 minutos (`THERAPIST_BUSY_OR_BUFFER`), terapeutas inactivos (`THERAPIST_INACTIVE`) y fallos de red inciertos.
       - Pantalla de confirmación con identificador devuelto por el servidor, horario calculado, terapeuta asignado y tarifa oficial.
  3. **Mis Citas de Bienestar (`/mis-reservas/bienestar`):**
     - **Listado de citas del cliente (`MisCitasSpaList`):**
       - Integrado en la barra de pestañas compartida (Habitaciones, Mesas, Amenidades, Actividades, Bienestar).
       - Claves de consulta TanStack Query aisladas por usuario (`["citas-bienestar", "mine", userId]`).
       - Visualización de identificador de cita, nombre del tratamiento, profesional asignado, fecha, intervalo horario y tarifa.
       - Acceso directo al botón de adición al carrito (`BotonAnadirAlCarrito`) y enlace al detalle.
     - **Detalle de cita (`DetalleCitaBienestarPage` y `CitaBienestarDetalleCard`):**
       - Accesible por URL directa (`/mis-reservas/bienestar/:id`) y tras recarga de página.
       - Manejo de identificador inválido, error 403 (cita perteneciente a otro cliente), error 404 y reintento.
       - Enlace de retorno visible a Mis citas de spa.
  4. **Administración de Citas, Tratamientos y Terapeutas:**
     - **Permisos y roles:** Todo el panel administrativo de bienestar está restringido exclusivamente a administradores (`servicios.administrar` / `ROLES.ADMIN`).
     - **Gestión de Citas (`/admin/citas-spa` y `/admin/citas-spa/:id`):**
       - Componente `AdminCitasSpaList`: filtros por estado operativo (`confirmada`, `completada`, `cancelada`), terapeuta y búsqueda por huésped, servicio o correo.
       - Componente `AdminDetalleCitaCard`: vista completa de la cita, huésped, terapeuta y horario.
       - Modal de cambio de estado operativo (`AdminCitaEstadoModal`) con confirmación, advertencia ante reactivación y manejo de traslapes en el backend.
     - **Gestión de Tratamientos (`/admin/servicios-spa`):**
       - Listado, creación y edición de servicios de spa con duración y precio (`ServicioSpaFormModal`).
     - **Gestión de Terapeutas (`/admin/terapeutas`):**
       - Listado, creación y edición de terapeutas (`TerapeutaFormModal`) con conmutador de estado activo/inactivo.
     - **Navegación administrativa:** Accesos directos integrados en la página central de servicios (`ServiciosPage.tsx`).
  5. **Integración con Carrito y Pasarela de Pagos:**
     - **Adición al carrito (`resolveBienestar`):**
       - Validación de existencia y propiedad de la cita en `carritoItem.service.ts`.
       - Prevención de doble cobro y adición concurrente mediante `hasCartReferenceActiveFinancialCommitment`.
       - Tarifa autoritativa del servicio asociada automáticamente al ítem de carrito.
     - **Visualización en carrito (`CarritoItemCard`):**
       - Soporte para `tipo_item === "bienestar"`, etiqueta "Bienestar" y enlace directo a `/mis-reservas/bienestar/:id`.
     - **Validación durante checkout (`cartTotals` en `pago.service.ts`):**
       - Validación de disponibilidad de la cita de bienestar antes de registrar pagos, rechazando citas canceladas (`CART_REFERENCE_NOT_AVAILABLE`).
     - **Cobro real mediante Stripe Elements y Webhook:**
       - La pasarela utiliza **Stripe Elements con PaymentIntent** (`POST /api/pagos` con `metodo: "tarjeta"`, `tipo_pago: "total"`, `idempotency_key`), devolviendo `client_secret` y `payment_intent_id` con estado `procesando`.
       - Confirmación y persistencia mediante el evento oficial `payment_intent.succeeded` procesado en `POST /api/pagos/stripe/webhook` con firma criptográfica.
       - Transición del pago a `aprobado` y del carrito a `pagado`.
       - Preservación del estado operativo de la cita (`confirmada`), manteniendo desacoplado el estado operativo del financiero.
       - Idempotencia garantizada ante reenvío o repetición del mismo evento de webhook.
       - Protección contra reutilización: rechazo con `409 CART_REFERENCE_NOT_AVAILABLE` al intentar agregar una cita ya pagada a un nuevo carrito.
     - **Invalidación de caché frontend:**
       - Implementada en `Frontend/src/features/pagos/hooks/usePagoResultado.ts`, invalidando `['citas-bienestar']` al aprobarse el pago del carrito.
  6. **Pruebas y Verificación:**
     - **Entorno aislado (hotel_test_db en puerto 55433):**
       - Suite de integración HTTP: `backend/tests/integration/postgres.bienestar.http.test.ts` (**16/16 pruebas pasando, 100%**).
       - Cobertura completa:
         1. Catálogo público de servicios (`GET /api/servicios-spa`).
         2. Permisos administrativos en servicios (403 cliente / 201 admin).
         3. Catálogo público de terapeutas (`GET /api/terapeutas`).
         4. Permisos administrativos en terapeutas (403 cliente / 201 admin).
         5. Restricción de reservas exclusivamente a clientes (403 admin).
         6. Rechazo de terapeutas inactivos (`422 THERAPIST_INACTIVE`).
         7. Creación de cita y cálculo autoritativo de `hora_fin`.
         8. **6 casos límite de descanso de 15 minutos** respecto a una cita de 11:00 a 12:00:
            - Cita que termina a las 11:00 (10:15 - 11:00) $\to$ rechazada (409).
            - Cita que termina a las 10:46 (10:01 - 10:46) $\to$ rechazada (409).
            - Cita que termina a las 10:45 (10:00 - 10:45) $\to$ admitida (201).
            - Cita que empieza a las 12:00 (12:00 - 12:45) $\to$ rechazada (409).
            - Cita que empieza a las 12:14 (12:14 - 12:59) $\to$ rechazada (409).
            - Cita que empieza a las 12:15 (12:15 - 13:00) $\to$ admitida (201).
         9. No interferencia entre terapeutas distintos en el mismo horario (admitida 201).
         10. No bloqueo por citas canceladas y revalidación de traslapes en reactivación con auto-exclusión (`[Op.ne]: id`).
         11. Protección de descanso en cruces de medianoche entre fechas de calendario contiguas.
         12. Consulta de mis reservas aislada por cliente (`GET /api/citas-spa/mis-reservas`).
         13. Protección de propiedad en detalle de reserva (403 ajeno / 200 propio).
         14. Consulta administrativa de citas (`GET /api/citas-spa`).
         15. Actualización administrativa de estado operativo (`PATCH /api/citas-spa/:id/estado`).
         16. Flujo completo de carrito a pago con Stripe PaymentIntent, webhook `payment_intent.succeeded`, persistencia de pago aprobado, carrito pagado, preservación de cita confirmada, replay idempotente de webhook y rechazo de re-adición al carrito.
     - **Pruebas unitarias de contrato OpenAPI:**
       - `backend/tests/unit/openapi.test.ts` (11/11 pruebas pasando, 100%).
     - **Pruebas frontend (Vitest / React Testing Library):**
       - `CatalogoBienestarCliente.test.tsx` (4 pruebas pasando).
       - `MisCitasSpaList.test.tsx` (2 pruebas pasando).
       - `AdminCitasSpaList.test.tsx` (1 prueba pasando).
     - **Comprobación de tipos y empaquetado:**
       - `npm run typecheck:all` (backend): 0 errores.
       - `npm run typecheck` (frontend): 0 errores.
       - `npm run build` (frontend): compilación de producción exitosa en `Frontend/dist/`.

---

## Tarea: Módulo de Eventos y Salones

- **Estado:** Completada e integrada en frontend y backend.
- **Alcance real identificado:**
  - En HOTEL HUNAHPÚ, "eventos" representa la **cotización y reserva de salones o espacios físicos** (`Salon`) para la celebración de eventos privados (corporativos/ejecutivos, bodas, cumpleaños o convivios/sociales), con la posibilidad de adjuntar **servicios adicionales para eventos** (`ServicioEvento` / `ReservaEventoServicio`, como catering, mantelería, equipo audiovisual, etc.).
  - No representa venta de boletos, conferencias públicas ni talleres.
  - Relaciones del modelo: `Salon` pertenece a `Sucursal`. `ReservaEvento` vincula a `Usuario` y `Salon`, y tiene múltiples `ReservaEventoServicio` que vinculan a `ServicioEvento`.
  - Estados operativos de la reserva: `cotizacion` (estado inicial al solicitar), `confirmada` (aprobada por administración), `cancelada` y `finalizada`.
  - Reglas financieras: el servidor calcula autoritativamente `total` (tarifa base del salón + suma de subtotales de servicios adicionales) y `anticipo` (50% del total).
- **Detalle de implementaciones:**
  1. **Backend y Contratos:**
     - Endpoint administrativo de cambio de estado operativo:
       - Ruta: `PATCH /api/reservas-evento/:id/estado` con middleware `requireRole(ROLES.ADMIN)`.
       - Validador: `updateReservaEventoEstadoSchema` admitiendo únicamente `["confirmada", "cancelada", "finalizada"]`.
       - Servicio: `reservaEvento.service.ts` ejecuta la mutación bajo transacción con bloqueo pesimista de fila (`LOCK.UPDATE`), validación estricta de no-modificación sobre reservas finalizadas o canceladas, comprobación de disponibilidad del salón ante confirmación, y soporte para que `getById` lea dentro de la misma transacción en curso.
     - Documentación OpenAPI y sincronización:
       - Esquemas y rutas documentadas en `backend/src/docs/swagger.ts`.
       - Cobertura de contrato en `backend/tests/unit/openapi.test.ts` (12/12 pruebas pasando, 103 paths y 194 operaciones en OpenAPI).
       - Regenerados tipos de Frontend mediante `npm --prefix Frontend run api:generate` sincronizando `schema.ts`.
  2. **Catálogo y Detalle para Clientes:**
     - **Catálogo de Salones (`/eventos`):**
       - Listado de salones públicos con nombre, sede, capacidad máxima, tarifa base por día y descripción.
       - Filtro dinámico por nombre/término y selector de sede hotelera.
       - Botón directo de "Cotizar evento" para abrir el modal de reserva y enlace a detalle.
     - **Detalle de Salón (`/eventos/salones/:id`):**
       - Vista profunda accesible directamente por URL y con soporte de recarga.
       - Muestra sede, aforo máximo, tarifas y botón para iniciar cotización.
     - **Modal de Cotización (`ReservaEventoModal`):**
       - Formulario accesible con React Hook Form y Zod: tipo de evento, fecha, hora de inicio, hora de fin y número de invitados (limitado al aforo del salón).
       - Aviso claro de que la cotización previa no aparta el recurso hasta el registro formal.
       - Redirección automática a la vista de Mis Reservas del evento creado.
  3. **Mis Reservas de Eventos (Cliente):**
     - **Listado (`/mis-reservas/eventos`):**
       - Pestaña "Eventos y Salones" integrada en la navegación de `MisReservasPage`.
       - Consultas privadas deshabilitadas durante restauración de sesión, aisladas por `userId`.
       - Filtros por estado operativo (`cotizacion`, `confirmada`, `cancelada`, `finalizada`).
       - Badges de estado, fecha, horario, número de invitados, importe total y anticipo requerido.
       - Enlace directo al detalle de cada evento.
     - **Detalle de Reserva de Evento (`/mis-reservas/eventos/:id`):**
       - Verificación de propiedad en frontend y backend (rechazo con 403 a usuarios ajenos).
       - Desglose financiero completo (tarifa del salón + servicios adicionales).
       - Gestión de servicios adicionales durante el estado de cotización: listado de servicios vinculados, modal para agregar servicios (`AgregarServicioEventoModal`) y opción para retirar servicios, recalculando automáticamente el total y anticipo en el servidor.
       - Cancelación de cotización por el cliente mediante `PATCH /api/reservas-evento/:id/cancelar`.
       - Botón integrado `BotonAnadirAlCarrito` para cotizaciones o reservas activas.
  4. **Administración (`servicios.administrar`):**
     - **Gestión de Salones (`/admin/salones`):**
       - Listado administrativo, creación y edición de salones (`SalonFormModal`).
       - Configuración de sede, nombre, aforo máximo, tarifa base y descripción.
     - **Gestión de Servicios de Evento (`/admin/servicios-evento`):**
       - Listado administrativo, creación y edición de servicios adicionales (`ServicioEventoFormModal`).
     - **Gestión de Reservas de Eventos (`/admin/reservas-evento`):**
       - Listado general de eventos con filtros por cliente, estado y fecha.
       - Visualización de datos completos del cliente (`Usuario.nombre`, `Usuario.email`).
       - Modal de cambio de estado operativo (`AdminReservaEventoEstadoModal`) con selección de nuevo estado (`confirmada`, `cancelada`, `finalizada`) y tratamiento de conflictos.
     - **Detalle Administrativo de Evento (`/admin/reservas-evento/:id`):**
       - Inspección a fondo del evento, desglose de costos y servicios solicitados.
     - Enlaces directos habilitados en `ServiciosPage.tsx` bajo la tarjeta de Eventos.
  5. **Integración con Carrito y Pasarela de Pagos:**
     - **Entidad referenciada:** `tipo_item: "evento"` referencia el identificador de la reserva/cotización de evento (`referencia_id: reserva.id`), no el ID del salón ni el del servicio.
     - **Adición al carrito (`resolveEvento` en `carritoItem.service.ts`):**
       - Validación de existencia y propiedad de la reserva del cliente autenticado.
       - Bloqueo de duplicados y de eventos ya pagados mediante `hasCartReferenceActiveFinancialCommitment`.
       - Asociación del importe financiero autoritativo (soporta anticipo requerido o total).
     - **Navegación e invalidación:**
       - `CarritoItemCard.tsx`: Enlace formal a `/mis-reservas/eventos/${item.referencia_id}` para ítems de tipo `evento`.
       - `usePagoResultado.ts`: Invalidación automática de la clave de consulta `['reservas-evento']` tras procesar el resultado del pago.
     - **Checkout y Webhook:**
       - Reutilización de Stripe Elements y PaymentIntent (`POST /api/pagos`).
       - Webhook `POST /api/pagos/stripe/webhook` procesa `payment_intent.succeeded` con validación de firma de prueba.
       - Transición a pago aprobado y carrito pagado, manteniendo desacoplado el estado operativo del financiero.
       - Idempotencia comprobada ante eventos repetidos.
       - Rechazo con `409 CART_REFERENCE_NOT_AVAILABLE` al intentar incorporar un evento ya pagado a un nuevo carrito.
  6. **Pruebas y Verificación:**
     - **Entorno aislado (hotel_test_db en puerto 55433):**
       - Suite de integración HTTP: `backend/tests/integration/postgres.eventos.http.test.ts` (**18/18 pruebas pasando, 100%**).
       - Cobertura:
         1. Catálogo público de salones (`GET /api/salones`).
         2. Detalle de salón por ID (`GET /api/salones/:id`).
         3. Permisos administrativos en salones (403 cliente / 201 admin).
         4. Actualización de salón por admin (`PATCH /api/salones/:id`).
         5. Catálogo público de servicios de evento (`GET /api/servicios-evento`).
         6. Permisos administrativos en servicios de evento (403 cliente / 201 admin).
         7. Validación de capacidad máxima (422).
         8. Validación de rango de horas (422 cuando fin <= inicio).
         9. Rechazo de fechas pasadas (422).
         10. Creación de cotización formal y cálculo automático de total y anticipo (50%).
         11. Adición de servicios adicionales y recálculo automático de total y anticipo.
         12. Listado de servicios vinculados a la reserva.
         13. Eliminación de servicio adicional y recálculo del total.
         14. Aislamiento por usuario autenticado en listado de reservas (`GET /api/reservas-evento`).
         15. Protección de propiedad en detalle (403 para cliente ajeno).
         16. Transición administrativa de estado (`PATCH /api/reservas-evento/:id/estado`, 403 cliente / 200 admin).
         17. Detección de traslapes y rechazo de reserva concurrente sobre el mismo salón y horario (409 `EVENT_ROOM_NOT_AVAILABLE`).
         18. Recorrido completo de carrito a pago con Stripe PaymentIntent, procesamiento de webhook `payment_intent.succeeded`, persistencia de pago aprobado, carrito pagado, idempotencia y rechazo ante reutilización de referencia pagada.
     - **Suites de pruebas backend de eventos:**
       - `backend/tests/eventos/reservaEvento.test.ts` (**40/40 pruebas pasando, 100%**).
       - `backend/tests/eventos/reservaEventoServicio.test.ts` (**39/39 pruebas pasando, 100%**).
       - `backend/tests/unit/openapi.test.ts` (**12/12 pruebas unitarias pasando, 100%**).
     - **Pruebas frontend (Vitest / React Testing Library):**
       - `CatalogoSalonesCliente.test.tsx` (**3/3 pruebas pasando**).
       - `MisReservasEventos.test.tsx` (**2/2 pruebas pasando**).
       - `AdminEventos.test.tsx` (**2/2 pruebas pasando**).
       - `CarritoPage.test.tsx`, `BotonAnadirAlCarrito.test.tsx`, `CheckoutPage.test.tsx`, `PagoResultadoPage.test.tsx`, etc. (**74/74 pruebas pasando**).
     - **Comprobación de tipos y empaquetado:**
       - `npm --prefix backend run typecheck:all`: 0 errores.
       - `npm --prefix Frontend run typecheck`: 0 errores.
       - `npm --prefix Frontend run build`: compilación de producción exitosa en `Frontend/dist/`.

---

## Cierre de Entrega y Verificación del Flujo Comercial de Eventos y Salones

- **Estado:** Completada, verificada y documentada formalmente.
- **Aclaración del Modelo de Roles del Sistema:**
  - El sistema cuenta globalmente con **6 roles definidos**: `admin`, `recepcionista`, `gerente_restaurante`, `gerente_habitaciones`, `empleado_operativo` y `cliente`.
  - La indicación de "únicamente admin y cliente" se circunscribe con exclusividad a los participantes operativos del módulo de **Eventos y Salones**:
    - **Cliente (`cliente`):** Rol autoservicio que consulta salones disponibles, solicita y modifica cotizaciones, gestiona servicios adicionales y realiza pagos mediante carrito y Stripe.
    - **Administrador (`admin`):** Rol exclusivo bajo el permiso `servicios.administrar` para la configuración física de salones, catálogo de servicios adicionales y aprobación formal / cambio de estado operativo de reservas (`PATCH /api/reservas-evento/:id/estado`).
    - Los roles restantes (`recepcionista`, `gerente_restaurante`, `gerente_habitaciones`, `empleado_operativo`) no participan en la administración de salones ni reservas de eventos, manteniendo intactos sus alcances y permisos en sus módulos correspondientes.
- **Verificación del Flujo Comercial y Reglas de Negocio:**
  - **Estados para adición al carrito:** Una reserva de evento solo puede ser agregada al carrito si se encuentra en estado no terminal (`cotizacion` o `confirmada`). Si la reserva ya posee pagos aprobados o en proceso (`procesando`), se rechaza con `409 CART_REFERENCE_NOT_AVAILABLE`.
  - **Cotización y pago:** En el backend, `payableEventStates` admite el pago tanto en estado `cotizacion` como `confirmada`. No se exige aprobación administrativa previa para pagar el anticipo/total fijado por las tarifas autoritativas de salón y servicios. La aprobación administrativa posterior revalida la disponibilidad del salón.
  - **Anticipo, Saldo y Pago Total (Aclaración de Interfaz):**
    - *Backend:* El servidor calcula automáticamente `total = tarifa_base + servicios` y `anticipo = round(total * 0.50)` (50%). La capa de pagos valida `ADVANCE_BELOW_REQUIRED` y `ADVANCE_REQUIRED_FIRST` si se envían pagos fraccionados.
    - *Interfaz (Frontend):* En `CheckoutPage.tsx`, el checkout actual ofrece **únicamente pago total** (`tipo_pago: "total"`) sobre el saldo pendiente del carrito. Las opciones de anticipo y saldo separados **no están disponibles en la interfaz**; `ResumenCheckout.tsx` muestra esos montos exclusivamente con fines informativos.
  - **Blindaje Financiero Previo al Cobro (Protección Integral ante Mutaciones y Cancelaciones):**
    - Se identificó y cerró la ventana donde una cotización podía modificarse o cancelarse tras la creación de un PaymentIntent en Stripe:
      - Se implementó `assertEventReservationCanBeMutated` en `backend/src/services/pago.service.ts` y se incorporó en `update`, `cancel` y `updateStatus` (cancelación) de `reservaEvento.service.ts`, así como en `create`, `update` y `remove` de `reservaEventoServicio.service.ts`.
      - Se bloquea con `409 EVENT_RESERVATION_HAS_ACTIVE_PAYMENT` cualquier intento de cliente o administrador de agregar, modificar cantidades, retirar servicios adicionales, alterar fechas/horarios/capacidad o cancelar la reserva mientras exista un pago local en `procesando` o `aprobado`.
      - Se contemplan expresamente pagos en estado `rechazado` localmente cuyo PaymentIntent en Stripe permanezca en `requires_payment_method`, `requires_confirmation`, `requires_action` o `processing` (recuperables en caliente en la misma sesión de checkout).
      - Se preserva el flujo seguro de reconciliación: si el carrito expiró o fue cancelado, el PaymentIntent huérfano se cancela limpiamente en Stripe (`cancelPaymentIntent`), liberando la reserva para ser modificada o cancelada sin bloqueos perpetuos.
      - Se eliminó la carrera entre `createPago` y la modificación/cancelación de la cotización mediante la incorporación de `lockEventReservations` en `validateOpenOrigin` (`pago.service.ts`), adquiriendo bloqueo pesimista de fila (`LOCK.UPDATE`) sobre las `ReservaEvento` del carrito en orden canónico determinista (`id ASC`).
- **Evidencias y Pruebas Ejecutadas:**
  - **Entorno aislado PostgreSQL (puerto 55433):**
    - `backend/tests/integration/postgres.eventos.http.test.ts` (**22/22 pruebas aprobadas, 100%**), incluyendo:
      1. Bloqueo de agregar a otro carrito una reserva con pago procesando (409).
      2. Bloqueo de modificar servicios, datos o cancelar ante intento confirmable (409).
      3. Bloqueo de mutaciones ante intentos rechazados localmente pero recuperables en Stripe (409), con desbloqueo limpio al expirar el carrito y cancelarse en pasarela.
      4. Serialización estricta por row lock de la carrera concurrente entre preparación de pago y mutación de cotización, con confirmación final de pago exitoso por webhook.
  - **Suites Unitarias de Eventos (Backend):**
    - `backend/tests/eventos/reservaEvento.test.ts`: **40/40 pruebas aprobadas**.
    - `backend/tests/eventos/reservaEventoServicio.test.ts`: **39/39 pruebas aprobadas**.
    - `backend/tests/unit/openapi.test.ts`: **12/12 pruebas aprobadas**.
  - **Suites de Frontend (Eventos, Carrito, Pagos):**
    - `src/features/eventos`: **7/7 pruebas aprobadas** (Catálogo, Mis Reservas y Admin).
    - `src/features/carrito` y `src/features/pagos`: **74/74 pruebas aprobadas**.
  - **Chequeo de Tipos y Empaquetado:**
    - `tsc --noEmit` (Frontend): 0 errores.
    - `tsc --noEmit` (Backend): 0 errores.
    - `npm run build` (Frontend): Compilación exitosa en 7.34s.

---

## Unificación de refactor/backend-architecture y ux/004-componentes (Lote Medios S3, UI y Validación)

- **Estado:** Completada, verificada y activada localmente.
- **Identificación de Hashes y Árbol de Integración:**
  - **Rama de integración destino:** `refactor/backend-architecture`
  - **HEAD base antes del merge:** `c15bf9a2024db539031efb7bb059a4bb80cb8c3f`
    - Comprobado que contiene como ancestros verificados: `6338f3d` (origen de QA José), `fc03aeb` (cierre de eventos) y `9bf92c6` (pruebas y contratos de eventos).
  - **HEAD del lote entregado de `ux/004-componentes`:** `591692e1a3efd8502d33d9c3629f64bfcb72233f` (`feat(media): integrar almacenamiento privado S3, branding y gestion de imagenes en sedes`).
  - **Commit de merge unificado:** `845cc5bd6be2218ba079c2b6eb80207a9fc094d3`
    - Integración limpia sin conflictos textuales.
- **Lote Funcional Integrado:**
  1. **Almacenamiento S3 Privado y Prefirmado:** Servicio de almacenamiento en AWS S3 con prefijos autorizados (`sedes/`, `branding/`), generación de URLs prefirmadas de subida y lectura firmadas temporalmente con expiración controlada, y exclusión de secretos en el control de versiones.
  2. **Validación Exhaustiva de Imágenes y Seguridad:** Decodificación ráster con `sharp`, validación de tipos MIME reales (`image/jpeg`, `image/png`, `image/webp`), saneamiento de metadatos EXIF sensibles, reempaquetado seguro y control de aforo / capacidad en habitaciones.
  3. **Gestión de Imágenes de Sedes e Idempotencia:** Endpoints `POST /api/sucursales/:id/imagen-presign`, `POST /api/sucursales/:id/imagen-confirmar` y `DELETE /api/sucursales/:id/imagen`. Idempotencia persistente en base de datos mediante la tabla `confirmaciones_subida`, disociación automática de créditos fotográficos (`KNOWN_ASSET_CREDITS`) y limpieza de objetos huérfanos en S3.
  4. **Componentes Base de Interfaz y Utilidades:** Inclusión de componentes UI reutilizables (`Badge`, `DataState`, `EmptyState`, `ErrorState`, `Skeleton`, `Spinner`, `Toast`), formateador monetario oficial `formatQ` (GTQ), y soporte de branding dinámico (`Brand.tsx`, `useBranding.ts`).
  5. **Contratos OpenAPI y Tipos Frontend:** OpenAPI actualizado a **106 paths y 197 operaciones**. Tipos de frontend regenerados fielmente en `Frontend/src/api/generated/schema.ts`.
- **Estado de Migraciones en Base de Datos:**
  - Migraciones añadidas en el lote:
    - `20261025150000-add-imagen-key-to-sucursales.js`
    - `20261026000000-create-confirmaciones-subida.js`
  - **Entorno de desarrollo local (`hotel_db:5432`):** Ambas migraciones ya se encontraban aplicadas (`up`). **No hay migraciones pendientes de aplicar**.
  - **Entorno de pruebas aislado (`hotel_test_db:55433`):** Verificadas exitosamente en el entorno de pruebas.
- **Evidencias y Resultados de Verificación:**
  - **Contratos OpenAPI (`backend/tests/unit/openapi.test.ts`):** 12/12 pruebas aprobadas (100%).
  - **Pruebas de Medios e Integridad Backend (PostgreSQL aislado 55433):**
    - `backend/tests/unit/s3.service.test.ts`: 5/5 pruebas aprobadas.
    - `backend/tests/unit/imageValidation.service.test.ts`: 8/8 pruebas aprobadas.
    - `backend/tests/integration/postgres.sucursalImagen.test.ts`: 10/10 pruebas aprobadas.
    - `backend/tests/integration/postgres.capacidadHabitacionIntegridad.test.ts`: 13/13 pruebas aprobadas.
  - **Pruebas Frontend (Medios, Sedes, Componentes UI y Utilidades):**
    - 12 archivos de test, 60 pruebas aprobadas (100%).
  - **Regresiones de Integración de Módulos Previos (PostgreSQL aislado 55433):**
    - `postgres.auth.test.ts`: 3/3 aprobadas.
    - `postgres.eventos.http.test.ts`: 22/22 aprobadas.
    - `postgres.bienestar.http.test.ts`: 16/16 aprobadas.
    - `postgres.carrito.http.test.ts`: 9/9 aprobadas.
    - `postgres.payments.test.ts`: 2/2 aprobadas.
  - **Chequeo de Tipos y Compilación:**
    - `npm --prefix backend run typecheck:all`: 0 errores.
    - `npm --prefix Frontend run typecheck`: 0 errores.
    - `npm --prefix Frontend run build`: compilación de producción exitosa (1927 módulos transformados).
- **Activación de Servicios Locales y Convivencia entre Agentes:**
  - Se identificó que la carpeta principal (`/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/SISTEMAHOTEL`) se encuentra en la rama `ux/004-componentes` con archivos de componentes UI de formularios en edición activa por otro agente.
  - Para preservar completamente el trabajo del otro agente sin provocar conflictos de trabajo en curso ni alterar su rama, se preparó el entorno de ejecución unificado en el worktree dedicado `/tmp/SISTEMAHOTEL-runtime` en la rama `refactor/backend-architecture` (commit `845cc5b`).
  - Los procesos antiguos que ejecutaban código no integrado fueron detenidos limpiamente y los servicios fueron reiniciados desde `/tmp/SISTEMAHOTEL-runtime`:
    - **Backend (Puerto 4000):** Escuchando activamente. Health check `GET /api/health` responde 200 OK (`"API de Hotel está funcionando correctamente"`), `GET /api/media/branding` responde 200 OK con URLs prefirmadas de S3 y `GET /api/sucursales` responde 200 OK con sedes y claves de imagen.
    - **Frontend (Puerto 5173):** Vite en ejecución activa respondiendo 200 OK.

---

## Normalización del Entorno de Ejecución en Carpeta Principal (SISTEMAHOTEL)

- **Estado:** Completada, verificada y activada exclusivamente en la carpeta principal.
- **Rama Final y HEAD:**
  - **Ubicación:** `/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/SISTEMAHOTEL`
  - **Rama activa:** `refactor/backend-architecture`
  - **HEAD final:** `63af139` (contiene el merge `3851011` y la corrección de tipos TypeScript).
- **Integración Completa de `ux/004-componentes`:**
  - Se rescataron e integraron todos los avances de la rama `ux/004-componentes`:
    1. **Lote 2 de Componentes UI:** `Card` (Header, Content, Footer), `Field` (con `useId`), `Checkbox`, `Radio`, `Select`, `Switch`, `Textarea`, `DateField`, `TimeField`, `Pagination`, `Table` con pruebas completas.
    2. **Lote 3 de Componentes UI:** `Countdown`, `PriceSummary`, `StatusTimeline`, `Stepper`, `Tabs` con pruebas y textos en `Frontend/src/i18n/es.ts`.
    3. **Medios y Créditos de Sedes:** Créditos oficiales para Antigua, Xela, Capital y Atitlán en `KNOWN_ASSET_CREDITS` y normalización de slugs con tolerancia `hunapu` / `hunahpu`.
    4. **Auditoría UI:** Registro y actualización de componentes en `docs/auditoria-componentes.md` y `docs/mejoras-ux.md`.
- **Desvinculación y Limpieza de Entornos Temporales:**
  - Se detuvieron los procesos temporales que ejecutaban desde `/tmp/SISTEMAHOTEL-runtime` (PIDs 214213, 214222, 214304, 214312).
  - Se eliminó el worktree temporal `/tmp/SISTEMAHOTEL-runtime`.
  - No queda ningún servidor ni proceso del hotel ejecutándose desde `/tmp`.
- **Devolución de Servicios a la Carpeta Principal:**
  - **Backend (Puerto 4000):**
    - Proceso PID `223457` / `223474` iniciado desde `/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/SISTEMAHOTEL/backend`.
    - Conexión efectiva a PostgreSQL `hotel_db:5432`.
    - Respuestas verificadas: `GET /api/health` (200 OK), `GET /api/media/branding` (200 OK), `GET /api/sucursales` (200 OK).
  - **Frontend (Puerto 5173):**
    - Proceso PID `223549` iniciado desde `/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/SISTEMAHOTEL/Frontend` mediante `vite`.
    - Respuesta verificada: `GET /` (HTTP/1.1 200 OK).
- **Comandos Normales de Arranque (Manual):**
  - Backend: `cd /home/diegorojas/Workspace/Universidad/DESARROLLOWEB/SISTEMAHOTEL/backend && npm run dev`
  - Frontend: `cd /home/diegorojas/Workspace/Universidad/DESARROLLOWEB/SISTEMAHOTEL/Frontend && npm run dev`
- **Resultados de Verificación Final:**
  - `npm --prefix backend run typecheck:all`: 0 errores.
  - `npm --prefix Frontend run typecheck`: 0 errores.
  - `npm --prefix Frontend run build`: compilación limpia en 8.72s.
  - Vitest UI (`Frontend/src/components/ui`): 23 archivos, 85 pruebas aprobadas (100%).
  - Vitest Backend (`openapi.test.ts`, `postgres.sucursalImagen.test.ts`, `s3.service.test.ts`, `imageValidation.service.test.ts` en 55433): 4 archivos, 35 pruebas aprobadas (100%).
