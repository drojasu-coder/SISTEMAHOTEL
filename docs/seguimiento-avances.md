# Seguimiento de Avances

Este documento registra de forma continua el avance técnico, archivos modificados, comandos ejecutados y bloqueos de cada tarea del encargo autónomo.

---

## Tarea 1: Completar lo posible de BE-014 (Pagos y Checkout)

- **Estado:** Completada la verificación de configuración y cobertura automatizada; comprobación interactiva en navegador detenida por bloqueo documentado.
- **Detalle de implementación / verificación:**
  - Verificada la configuración local sin revelar secretos: backend cuenta con `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` de prueba; frontend carece de `VITE_STRIPE_PUBLISHABLE_KEY`.
  - Cobertura automatizada revisada: verificados todos los casos de resiliencia transaccional (rechazo de tarjeta, recuperación de intento, protección contra cobro incompatible ante éxito pendiente de webhook, aislamiento por usuario, desajuste de importe, fin de sondeo).
  - Estado de BE-014 mantenido en: *integración/verificación pendiente* hasta que se cuente con la clave pública de frontend y entorno interactivo.
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
  - **Auditoría de enlaces y rutas internas:** Se inspeccionaron todas las etiquetas `<Link>` y `<NavLink>` en `Frontend/src/`. Todas las rutas de destino coinciden exactamente con rutas registradas y activas en `Frontend/src/app/router/AppRouter.tsx` (rutas públicas `/`, `/reservar`, `/mis-reservas`, `/mis-reservas/habitacion/:id`, `/carrito`, `/checkout`, `/pagos/:id/resultado`, `/login`, `/registro`, `/cuenta`, y administrativas `/admin`, `/admin/habitaciones`, `/admin/reservas`, `/admin/reservas/:id`, `/admin/tipos-habitacion`, `/admin/parqueos`, `/admin/amenidades`, `/admin/mesas`, `/admin/sedes`). No existen enlaces rotos hacia rutas inexistentes.
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
  - **Distinción metodológica de comprobaciones:**
    - *Revisión estática de código:* Verificación cruzada entre `AppRouter.tsx`, `permissions.ts`, layouts y componentes.
    - *Pruebas de componentes y rutas:* 268 pruebas unitarias y de integración aprobadas (`npm --prefix Frontend test`).
    - *Comprobación visual real:* Detenida la inspección gráfica directa por ausencia de navegador gráfico/servidor headless interactivo en el entorno, pero verificada la cobertura mediante renderizado de Testing Library en jsdom.
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
