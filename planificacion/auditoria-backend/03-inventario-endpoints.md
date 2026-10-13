# 03 — Inventario de endpoints

## Convenciones

- Prefijo global: `/api`.
- La tabla de abajo resume las rutas declaradas en los 38 routers y las 184 operaciones expuestas/documentadas en el corte.
- `Auth` indica JWT mediante `authMiddleware`; `Público` no exige JWT; `Rol` agrega `requireRole` o listas de roles.
- Los nombres exactos de body, params, query, mensajes y códigos están en el validator/controller de cada fila; no se deben inventar DTOs durante la refactorización.
- CRUD: `GET /` y `GET /:id` leen; `POST /` crea (201); `PATCH` actualiza (200); `DELETE` elimina/cancela (200 en los módulos actuales). Hay excepciones indicadas abajo.

## Rutas por módulo

| Módulo / controller → service | Operaciones | Auth y validación | Contrato/regla a preservar |
|---|---|---|---|
| `auth` → `auth.service` | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Register/login públicos con Zod; `/me` Auth | Registro fuerza rol cliente; login devuelve JWT; `/me` usa usuario vigente. |
| `usuarios` → `usuarios/usuario.service` | CRUD `/usuarios`; `PATCH /usuarios/:id/rol`; `PATCH /usuarios/:id/estado` | Auth y gestión con roles; params/body Zod | Cambiar rol/activo requiere autorización; no devolver password. |
| Catálogos públicos: sucursales, salones, servicios evento, mesas, instructores, recursos, terapeutas, servicios spa | CRUD en `/sucursales`, `/salones`, `/servicios-evento`, `/mesas`, `/instructores`, `/recursos-actividad`, `/terapeutas`, `/servicios-spa` | Lecturas públicas en varios módulos; escritura Auth/Rol según router; Zod en body/ID | Mantener nombres de recursos y relaciones con sucursal. |
| Habitaciones | CRUD `/habitaciones`; tipos `/tipos-habitacion`; parqueos `/parqueos`; promociones `/promociones` | Lecturas con Auth en el corte; escritura con roles de gestión en los routers correspondientes | Capacidad, tarifas, disponibilidad, estado y relaciones no cambian. |
| Reservas habitación → `reservaHabitacion.controller` → service | `GET/POST/PATCH/DELETE /reservas-habitacion` y `/:id` | Auth; ownership/roles; Zod body/params | Fechas, traslape, usuario, habitación, estado y cancelación histórica. |
| Reservas parqueo → service | `GET/POST/PATCH/DELETE /reservas-parqueo` y `/:id` | Auth; ownership/roles; Zod | Parqueo vinculado a reserva, disponibilidad y estados. |
| Reservas actividad → controller → service | `GET /reservas-actividad`, `GET /:id`, `POST /`, `PATCH /:id/estado` | Auth/roles según route; Zod | Recurso e instructor no se traslapan; fecha no pasada; duración 30 min–2 h. |
| Reservas amenidad → service | `GET /reservas-amenidad`, `GET /:id`, `POST /`, `PATCH /:id/estado` | Auth/roles; Zod | Propiedad, disponibilidad, estado y validaciones del hardening. |
| Reservas mesa → controller → service | `GET /reservas-mesa`, `GET /:id`, `POST /`, `PATCH /:id/estado` | Auth/roles; Zod | Mesa/sucursal, fecha/hora, capacidad, traslape y transición de estado. |
| Eventos | CRUD `/reservas-evento`; `GET/POST/PATCH/DELETE /reservas-evento/:reservaId/servicios`; CRUD `/servicios-evento`; CRUD `/salones` | Auth/Rol según router; Zod | Servicios pertenecen a la reserva; no romper ruta anidada. |
| Bienestar | `POST/GET/GET:id /citas-spa`, `PATCH /citas-spa/:id/estado`; CRUD `/terapeutas`, `/servicios-spa` | Citas con Auth y administración; catálogos según router | Terapeuta/servicio y transición de cita. |
| Parque | CRUD `/boletos-parque`; `PATCH /boletos-parque/:id/estado` | Auth/Rol; Zod | Precios se leen de env; estados y usuario se preservan. |
| Transporte | CRUD `/choferes`, `/vehiculos`; CRUD `/reservas-transporte`; `PATCH /:id/asignar`, `PATCH /:id/cancelar` | Auth/Rol; Zod | Asignación chofer/vehículo, bloqueo configurado y cancelación. |
| Carrito | `GET /carritos`, `/carritos/:id`, `/carritos/actual`, `POST /carritos`; `GET/POST/DELETE /carritos/:carritoId/items` y `GET /:id` | Auth; Zod | Propiedad del carrito, expiración y referencia polimórfica de item. |
| Facturación | CRUD `/facturas`; CRUD `/factura-items` | Lectura Auth; escritura roles de facturación; Zod | IVA, usuario, detalle y relaciones con carrito/servicios. |
| Proveedores | CRUD `/proveedores`, `/proveedor-productos`, `/cuentas-por-pagar` | Auth; escritura con roles de proveedores; Zod | FK y estados de obligaciones. |
| Configuración | `GET/PATCH /configuraciones/iva` | Auth; actualización de administración; Zod | Porcentaje IVA vigente, sin cambiar forma de respuesta. |
| Pagos → controller → `pago.service` | `POST /pagos`; `GET /pagos`, `GET /pagos/:id`, `GET /pagos/resumen`; `POST /pagos/:id/aprobar-transferencia`; `POST /pagos/:id/reembolso` | Auth; roles para aprobación/reembolso; Zod | Origen carrito/reserva exclusivo, ownership, idempotencia, estados y montos. |
| Stripe | `POST /pagos/stripe/webhook` | Público técnicamente, protegido por `Stripe-Signature`; `express.raw` antes de JSON | Cuerpo raw, firma válida, respuesta `{received:true}` y procesamiento idempotente. |

## Matriz de operaciones exacta

La lista canónica completa (método y ruta) se encuentra en `backend/openapi.json` local y se obtuvo de `src/docs/swagger.ts`/routers. Incluye:

- **GET (77):** health, auth/me, listados y detalle de los recursos anteriores; `/carritos/actual`, `/pagos/resumen` y las rutas anidadas de items/servicios.
- **POST (41):** register/login, creación de cada recurso, reservas, carrito/items, pagos, aprobación/reembolso y webhook.
- **PATCH (40):** actualización CRUD y acciones `/estado`, `/rol`, `/asignar`, `/cancelar`, `/iva`.
- **DELETE (26):** eliminación CRUD y cancelaciones históricas expuestas como delete en reservas de habitación/parqueo.

Antes de consumir desde frontend se debe exportar esta matriz con schemas de request/response desde OpenAPI y revisar manualmente las rutas donde la documentación marca `bearerAuth` pero el router aplica middleware a nivel de bloque.

## Respuesta y códigos actuales

- Éxito reciente: `{ success: true, statusCode, message, data }`.
- Éxito legado: `{ status: "success", data }`.
- Error central: `{ success:false, statusCode, code, message, details? }`.
- Códigos observados: 200 lectura/actualización, 201 creación, 400 validación, 401 autenticación, 403 rol/estado de cuenta, 404 inexistencia, 409 conflicto, 422 regla/datos y 503 base no disponible.

## Contratos que deben quedar congelados para frontend

Rutas, verbos, nombres de campos en español, estados, códigos de error, formato de paginación si se incorpora y el webhook raw. Cualquier unificación de respuesta debe introducir compatibilidad o una versión explícita, no cambiar silenciosamente todos los controladores.
