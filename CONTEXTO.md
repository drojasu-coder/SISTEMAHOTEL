# CONTEXTO DEL PROYECTO · HOTEL HUNAHPÚ

> Este documento proporciona una visión técnica integral y estructurada del sistema **Hotel Hunahpú** (`SISTEMAHOTEL`), orientada a contextualizar a desarrolladores y modelos de inteligencia artificial que ingresan al repositorio por primera vez.

---

## 1. Resumen del Proyecto

### ¿Qué hace?
**Hotel Hunahpú** es una plataforma web integral de gestión hotelera y resort turístico multisede. Combina dos interfaces principales en una única solución:
1. **Portal Público y de Autoservicio para Clientes:** Permite explorar sedes, buscar disponibilidad de habitaciones, cotizar y reservar salones de eventos, reservar mesas de restaurante, agendar actividades recreativas con o sin instructor, programar citas de bienestar y spa, gestionar pases de amenidades con códigos QR, unificar reservas heterogéneas en un carrito de compras y pagar mediante tarjeta de crédito/débito (Stripe) o transferencias bancarias.
2. **Panel de Gestión y Operaciones (Backoffice Administrativo):** Permite al personal administrativo gestionar sucursales, habitaciones, tarifas, mesas, amenidades, salones, instructores, terapeutas, consultar y filtrar catálogos globales de reservas, y auditar transacciones.

### ¿Para quién es?
- **Huéspedes / Clientes (`cliente`):** Usuarios finales autenticados o visitantes que reservan y pagan servicios hoteleros.
- **Personal Administrativo y Operativo:**
  - `admin`: Superadministrador con acceso transversal a configuración, sucursales, finanzas, catálogos y reservas.
  - `recepcionista`: Gestión y consulta de habitaciones, reservas de huéspedes y parqueos.
  - `gerente_habitaciones`: Control de catálogo de habitaciones, tipos y ocupación.
  - `gerente_restaurante`: Gestión de mesas y reservas gastronómicas.
  - `empleado_operativo`: Personal operativo con accesos limitados según su área.

### ¿Qué problema resuelve?
- **Eliminación de silos operativos:** Unifica hospedaje, gastronomía, spa, actividades recreativas y salones de eventos en un flujo comercial centralizado con un carrito de compra unificado.
- **Integridad financiera y concurrencia:** Previene sobreventa (*overbooking*), solapamiento de horarios (mediante validaciones de traslape y bloqueos pesimistas de fila en base de datos), duplicidad de transacciones (idempotencia estricta en pagos) y cobros huérfanos ante carritos expirados.
- **Consistencia de contratos:** Arquitectura desacoplada donde el frontend TypeScript se rige por contratos generados automáticamente a partir de especificaciones OpenAPI 3.0 validadas en el backend.

---

## 2. Stack Tecnológico

### Backend (`/backend`)
- **Lenguaje:** TypeScript `5.6.3` / Node.js (entorno CommonJS en runtime).
- **Ejecución en desarrollo:** `ts-node-dev ^2.0.0`, `ts-node ^10.9.2`.
- **Framework Web:** Express `^5.2.1`.
- **Base de Datos & ORM:**
  - Motor: PostgreSQL 16 (vía contenedor Docker).
  - Conector: `pg ^8.23.0`, `pg-hstore ^2.3.4`.
  - ORM: `sequelize ^6.37.8`, `sequelize-cli ^6.6.5`.
- **Validación de Esquemas:** Zod `^4.6.2`.
- **Autenticación & Seguridad:**
  - JWT: `jsonwebtoken ^9.0.3`.
  - Hashing de contraseñas: `bcryptjs ^3.0.3`.
  - Cabeceras de seguridad: `helmet ^8.3.0`.
  - CORS: `cors ^2.8.6`.
  - Límite de tasa: `express-rate-limit ^8.7.1`.
- **Pasarela de Pagos:** Stripe Node SDK `^18.5.0`.
- **Almacenamiento Cloud (Multimedia):** AWS SDK S3 `@aws-sdk/client-s3 ^3.1156.0`, `@aws-sdk/s3-request-presigner ^3.1156.0`.
- **Documentación OpenAPI / Swagger:** `swagger-jsdoc ^6.3.0`, `swagger-ui-express ^5.0.1`.
- **Testing:** `vitest ^5.0.4`, `@vitest/coverage-v8 ^5.0.4`, `supertest ^7.3.1`.
- **Configuración:** `dotenv ^17.4.2`.

### Frontend (`/Frontend`)
- **Lenguaje:** TypeScript `^5.6.3`.
- **Framework / Bundler:** React `^18.3.1`, React DOM `^18.3.1`, Vite `^6.0.3` (ES Modules).
- **Enrutamiento:** React Router DOM `^6.28.0`.
- **Gestión de Estado Asíncrono / Caché:** TanStack React Query `^5.62.8`.
- **Formularios & Validación:** React Hook Form `^7.54.1`, `@hookform/resolvers ^3.9.1`, Zod `^3.24.1`.
- **Estilos & UI:** Tailwind CSS `^3.4.17`, PostCSS `^8.4.49`, Autoprefixer `^10.4.20`, Lucide React `^0.468.0`.
- **Integración Pasarela:** `@stripe/stripe-js ^10.1.0`, `@stripe/react-stripe-js ^7.0.0`.
- **Códigos QR:** `qrcode.react ^4.2.0` (pases de acceso para amenidades).
- **Generación de Contratos:** `openapi-typescript ^7.4.4`.
- **Testing:** `vitest ^2.1.8`, `@testing-library/react ^16.1.0`, `@testing-library/jest-dom ^6.6.3`, `@testing-library/user-event ^14.5.2`, `jsdom ^25.0.1`.

### Infraestructura & Entorno
- **Contenedores:** Docker & Docker Compose (`docker-compose.yml` con `postgres:16` y `pgadmin4`).
- **Pasarela local:** Stripe CLI (`stripe listen`).

---

## 3. Estructura de Carpetas

```text
SISTEMAHOTEL/
├── AGENTS.md                  # Reglas de ingeniería, protocolo QA y estándares de concurrencia
├── CONTEXTO.md                # Este documento de contexto integral
├── docker-compose.yml         # Contenedores para PostgreSQL (5432) y pgAdmin (5050)
├── docs/                      # Informes de avances, seguimiento de tareas y guías de entornos
│   ├── guia-arranque-entornos.md       # Separación estricta de entornos y puertos
│   ├── informe-avances.md              # Informe técnico consolidado para el equipo
│   ├── pendientes-backend.md           # Registro formal de tareas BE-001 a BE-014
│   ├── seguimiento-avances.md          # Bitácora continua de tareas ejecutadas por el coordinador
│   └── seguimiento-integracion-pagos.md# Evidencia de integración de Stripe y webhooks
├── planificacion/             # Documentación histórica, auditorías de arquitectura y DER
│   ├── GUIA-PRUEBAS-PAGOS.md           # Procedimientos de prueba con Stripe CLI
│   └── TABLAS-Y-RELACIONES.md          # Especificación detallada de las 39 tablas
├── script.sql                 # Dump DDL SQL generado con pg_dump para bootstrap directo
├── backend/                   # Código fuente del servidor Express / Sequelize
│   ├── src/
│   │   ├── config/            # Entorno validado con Zod (env.ts), seguridad HTTP y logger
│   │   ├── constants/         # Roles del sistema, estados y tipos estáticos
│   │   ├── controllers/       # Controladores HTTP agrupados por dominio de negocio
│   │   ├── docs/              # Configuración y esquemas canónicos de Swagger / OpenAPI
│   │   ├── middlewares/       # Auth JWT, validación Zod, roles, manejo centralizado de errores
│   │   ├── migrations/        # 46 archivos de migración canónicos de Sequelize
│   │   ├── models/            # 38 modelos Sequelize con definiciones y relaciones
│   │   ├── modules/           # Módulos refactorizados bajo arquitectura limpia (sucursales, configuraciones)
│   │   ├── routes/            # Definición de rutas Express con anotaciones JSDoc OpenAPI
│   │   ├── seeders/           # Semillas de base de datos
│   │   ├── services/          # Lógica de negocio transaccional, financiera y pasarelas
│   │   ├── utils/             # Helpers de cálculo financiero, autoría y propiedad
│   │   └── validators/        # Esquemas Zod para query, params y body de endpoints
│   ├── tests/                 # Suites de pruebas Vitest (unitarias, integración PostgreSQL, concurrencia)
│   └── package.json           # Dependencias y scripts de backend
└── Frontend/                  # Aplicación de cliente y panel administrativo React + Vite
    ├── src/
    │   ├── api/               # Cliente HTTP nativo (http.ts), sesión (session.ts) y schema OpenAPI generado
    │   ├── app/               # Configuración central (env.ts), router (AppRouter.tsx), providers
    │   ├── assets/            # Branding institucional, logotipos SVG
    │   ├── components/        # Componentes UI reutilizables (Button, Input, Card, Modal, Navbar, Footer)
    │   ├── features/          # Módulos de dominio (auth, reservas, carrito, pagos, restaurante, etc.)
    │   │   └── <modulo>/      # Componentes, hooks React Query, api client y pruebas unitarias
    │   ├── i18n/              # Textos centralizados de la interfaz en español formal (es.ts)
    │   ├── layouts/           # GuestLayout (sitio público) y AdminLayout (panel con drawer móvil)
    │   ├── pages/             # Componentes de página vinculados a rutas de React Router
    │   └── test/              # Configuración de Vitest, mocks y utilidades de renderizado
    └── package.json           # Dependencias y scripts de frontend
```

---

## 4. Arquitectura y Flujo de Datos

### Diagrama Conceptual de Conexión

```text
[ Navegador Web ]
       │
       ▼ (React 18 / Vite / Tailwind)
[ Frontend Client ] ──(sessionStorage: JWT)
       │
       ├─► HTTP / REST (JSON) ─────────────► [ Backend Express 5 ] (Puerto 4000)
       │                                              │
       ├─► Stripe Elements (Iframe Seguro)            ├─► PostgreSQL 16 (hotel_db / hotel_test_db)
       │        │                                     ├─► Stripe API (sk_test_...)
       │        ▼                                     ├─► AWS S3 (Bucket multimedia privado)
       │   [ Stripe Servers ]                         │
       │        │                                     │
       │        └──── Webhook HTTP POST (Raw Body) ───┘
       └──────────────────────────────────────
```

### Flujos Clave de la Aplicación

1. **Autenticación y Sesión:**
   - El cliente inicia sesión en `POST /api/auth/login`. El backend valida credenciales con `bcryptjs`, genera un JWT firmado con `JWT_SECRET` (expiración configurable, por defecto 1 hora) y retorna `{ accessToken, usuario }`.
   - El token se conserva en `sessionStorage` (`Frontend/src/api/session.ts`) y se envía en la cabecera `Authorization: Bearer <token>`.
   - Las peticiones privadas comparten un `AbortSignal` transversal; al cerrar sesión, se abortan las peticiones pendientes para no dejar respuestas cruzadas en la UI.
   - En el backend, `authMiddleware` valida el JWT y populates `req.user`. `requireRole(...)` valida el rol contra los permitidos.

2. **Flujo de Contratos Tipados (OpenAPI):**
   - Las rutas del backend documentan sus esquemas con JSDoc OpenAPI (`@openapi`).
   - `backend/src/docs/swagger.ts` define los esquemas canónicos reutilizables en `components.schemas`.
   - Se exporta la especificación con `npm --prefix backend run openapi:export`.
   - El script `npm --prefix Frontend run api:generate` lee la especificación y genera `Frontend/src/api/generated/schema.ts` mediante `openapi-typescript`.
   - Los clientes del frontend (`api.get<paths[...]>()`) consumen estos tipos garantizando chequeo estricto en tiempo de compilación (`tsc --noEmit`).

3. **Flujo Comercial: Reserva -> Carrito -> Checkout -> Webhook:**
   - **Reserva:** El cliente crea una reserva en estado preliminar (`pendiente` o `cotizacion`).
   - **Carrito:** Se invoca `getOrCreateActiveCart()`. Si no hay carrito activo, consulta `GET /api/carritos/actual` (404 si no existe) y ejecuta `POST /api/carritos`. Luego agrega la reserva mediante `POST /api/carritos/:id/items`.
   - **Checkout:** Al ingresar a `/checkout`, el cliente consulta `GET /api/pagos/resumen` (saldo del servidor) y `GET /api/pagos/intento-activo`. Al presionar pagar, se genera una clave de idempotencia segura (`chk-u{userId}-c{carritoId}-{uuid}`) y se invoca `POST /api/pagos` enviando `{ carrito_id, metodo: "tarjeta", tipo_pago: "total" }`. El backend crea un `PaymentIntent` en Stripe y registra el pago como `procesando`.
   - **Confirmación Stripe:** El frontend confirma el pago con el SDK de Stripe Elements (`stripe.confirmPayment`).
   - **Webhook Asíncrono:** Stripe invoca `POST /api/pagos/stripe/webhook`. Express procesa el cuerpo crudo binario (`express.raw`) para verificar la firma `Stripe-Signature`. Al verificar el evento `payment_intent.succeeded`, el backend asienta transaccionalmente el pago como `aprobado`, el carrito como `pagado` y las reservas vinculadas como `confirmada`.
   - **Recuperación:** Si la conexión se interrumpe, `GET /api/pagos/intento-activo` recupera el `client_secret` del `PaymentIntent` en curso sin crear cobros dobles ni lanzar errores 409 de saldo excedido.

4. **Manejo Centralizado de Errores:**
   - Backend: Clases `AppError` con códigos semánticos (`RESOURCE_NOT_FOUND`, `INSUFFICIENT_PERMISSIONS`, `PAYMENT_EXCEEDS_BALANCE`, `VALIDATION_ERROR`, etc.). `errorHandler` captura excepciones, formatea a JSON estándar e intercepta errores de base de datos como *deadlocks* (503) y restricciones de unicidad (409).
   - Frontend: `ApiError` desglosa `status`, `code` y lista de `details: [{ field, message }]`.

---

## 5. Base de Datos

El sistema cuenta con **39 tablas en PostgreSQL** (38 tablas funcionales de negocio y 1 técnica: `SequelizeMeta` para control de migraciones).

### Agrupación por Dominio y Relaciones

#### A. Usuarios y Personal
- `usuarios`: Clientes, administradores y personal.
  - Campos principales: `id`, `nombre`, `email` (único), `password_hash`, `rol`, `telefono`, `activo`.
  - Relaciones: 1 a 1 con `empleados`; 1 a N con reservas, carritos, facturas y boletos.
- `empleados`: Ficha laboral del personal.
  - Campos: `id`, `usuario_id` (FK), `sucursal_id` (FK), `puesto`, `salario`, `fecha_contratacion`, `estado`.
- `turnos`: Asignación horaria.
  - Campos: `id`, `empleado_id` (FK), `fecha`, `hora_inicio`, `hora_fin`, `tipo_turno`.

#### B. Sedes y Configuración
- `sucursales`: Sedes físicas del complejo hotelero.
  - Campos: `id`, `nombre`, `direccion`, `ciudad`, `telefono`, `activa`, `imagen_key`.
- `configuraciones`: Claves globales (porcentaje de IVA, políticas).
  - Campos: `id`, `clave` (única), `valor`, `descripcion`.

#### C. Hospedaje y Habitaciones
- `tipos_habitacion`: Catálogo de tipos de habitación.
  - Campos: `id`, `nombre`, `descripcion`, `capacidad_adultos`, `capacidad_ninos`, `tarifa_base`.
- `habitaciones`: Inventario físico de habitaciones.
  - Campos: `id`, `sucursal_id` (FK), `tipo_habitacion_id` (FK), `numero`, `piso`, `estado` (`disponible`, `ocupada`, `mantenimiento`).
- `reservas_habitacion`: Reservas de alojamiento.
  - Campos: `id`, `usuario_id` (FK), `habitacion_id` (FK), `fecha_entrada`, `fecha_salida`, `numero_huespedes`, `estado` (`pendiente`, `confirmada`, `cancelada`, `finalizada`), `total`, `notas`.
- `promociones`: Descuentos aplicables.
  - Campos: `id`, `codigo` (único), `descripcion`, `porcentaje_descuento`, `fecha_inicio`, `fecha_fin`, `activa`.
- `parqueos`: Espacios de estacionamiento.
  - Campos: `id`, `sucursal_id` (FK), `numero`, `tipo`, `estado`.
- `reservas_parqueo`: Asignación de parqueo vinculada a estancia.
  - Campos: `id`, `reserva_habitacion_id` (FK), `parqueo_id` (FK), `fecha_inicio`, `fecha_fin`, `estado`.

#### D. Restaurante
- `mesas`: Mesas de cada restaurante por sucursal.
  - Campos: `id`, `sucursal_id` (FK), `numero`, `capacidad`, `ubicacion`, `estado`.
- `reservas_mesa`: Reservas gastronómicas de clientes.
  - Campos: `id`, `usuario_id` (FK), `mesa_id` (FK), `fecha`, `hora`, `numero_personas`, `estado` (`pendiente`, `confirmada`, `cancelada`, `completada`), `notas`.

#### E. Actividades Recreativas
- `instructores`: Guías deportivos y de recreación.
  - Campos: `id`, `nombre`, `especialidad`, `telefono`, `activo`.
- `recursos_actividad`: Instalaciones y equipo (canchas de tenis, botes, etc.).
  - Campos: `id`, `sucursal_id` (FK), `nombre`, `tipo`, `capacidad`, `precio_hora`, `estado`.
- `reservas_actividad`: Agendamiento de actividades.
  - Campos: `id`, `usuario_id` (FK), `recurso_id` (FK), `instructor_id` (FK opcional), `fecha`, `hora_inicio`, `hora_fin`, `total`, `estado`.

#### F. Amenidades e Instalaciones
- `amenidades`: Piscinas, saunas, áreas infantiles.
  - Campos: `id`, `sucursal_id` (FK), `nombre`, `descripcion`, `horario_apertura`, `horario_cierre`, `capacidad_maxima`, `estado`.
- `reservas_amenidad`: Pases de acceso para amenidades.
  - Campos: `id`, `usuario_id` (FK), `amenidad_id` (FK), `fecha`, `hora_inicio`, `hora_fin`, `numero_personas`, `codigo_qr`, `estado`.

#### G. Bienestar y Spa
- `terapeutas`: Profesionales del spa.
  - Campos: `id`, `nombre`, `especialidad`, `telefono`, `activo`.
- `servicios_bienestar`: Catálogo de masajes y tratamientos.
  - Campos: `id`, `nombre`, `descripcion`, `duracion_minutos`, `precio`, `estado`.
- `citas_bienestar`: Citas de spa reservadas.
  - Campos: `id`, `usuario_id` (FK), `servicio_bienestar_id` (FK), `terapeuta_id` (FK), `fecha`, `hora_inicio`, `hora_fin`, `total`, `estado`.

#### H. Eventos y Salones
- `salones`: Espacios para convenciones y banquetes.
  - Campos: `id`, `sucursal_id` (FK), `nombre`, `capacidad_maxima`, `tarifa_base`, `estado`.
- `servicios_evento`: Servicios complementarios (audiovisuales, catering, decoración).
  - Campos: `id`, `nombre`, `descripcion`, `precio`, `estado`.
- `reservas_evento`: Cotizaciones y reservas de eventos.
  - Campos: `id`, `usuario_id` (FK), `salon_id` (FK), `fecha`, `hora_inicio`, `hora_fin`, `total`, `anticipo`, `estado` (`cotizacion`, `confirmada`, `cancelada`, `finalizada`), `notas`.
- `reserva_evento_servicios`: Detalle de servicios en una reserva de evento.
  - Campos: `id`, `reserva_evento_id` (FK), `servicio_evento_id` (FK), `cantidad`, `precio_unitario`, `subtotal`.

#### I. Parque Temático y Transporte
- `boletos_parque`: Boletos de acceso al parque temático.
  - Campos: `id`, `usuario_id` (FK), `tipo_boleto`, `cantidad`, `precio_unitario`, `total`, `fecha_visita`, `estado`.
- `choferes`: Conductores certificados.
  - Campos: `id`, `nombre`, `licencia`, `telefono`, `estado`.
- `vehiculos`: Flota de transporte.
  - Campos: `id`, `modelo`, `placa`, `capacidad`, `estado`.
- `reservas_transporte`: Servicios de traslado.
  - Campos: `id`, `usuario_id` (FK), `chofer_id` (FK), `vehiculo_id` (FK), `origen`, `destino`, `fecha_hora`, `total`, `estado`.

#### J. Carrito, Transacciones y Pagos
- `carritos`: Contenedor transaccional temporal de compras.
  - Campos: `id`, `usuario_id` (FK), `estado` (`activo`, `expirado`, `pagado`), `expira_en`.
- `carrito_items`: Elementos agregados al carrito (referencia polimórfica).
  - Campos: `id`, `carrito_id` (FK), `tipo_item` (`habitacion`, `actividad`, `evento`, etc.), `referencia_id` (ID en la tabla respectiva), `precio`, `cantidad`, `descripcion`, `promocion_id` (FK opcional).
- `pagos`: Transacciones de pago.
  - Campos: `id`, `reserva_habitacion_id` (FK opcional), `carrito_id` (FK opcional), `monto`, `metodo` (`tarjeta`, `efectivo`, `transferencia`), `estado` (`pendiente`, `procesando`, `aprobado`, `rechazado`, `cancelado`, `reembolsado`, `reembolsado_parcial`), `id_transaccion_externo` (PaymentIntent en Stripe), `moneda` (`GTQ`), `tipo_pago` (`total`, `anticipo`, `saldo`), `pasarela`, `idempotency_key` (único), `fecha_pago`, `codigo_error_externo`, `mensaje_error`.
- `reembolsos`: Devoluciones asociadas a pagos.
  - Campos: `id`, `pago_id` (FK), `monto`, `motivo`, `estado`, `id_reembolso_externo`.

#### K. Facturación y Proveedores
- `facturas`: Facturas fiscales emitidas.
  - Campos: `id`, `usuario_id` (FK), `numero_factura`, `serie`, `nit_cliente`, `nombre_cliente`, `direccion_cliente`, `fecha_emision`, `subtotal`, `iva`, `total`, `estado`.
- `factura_items`: Detalle de líneas de factura.
  - Campos: `id`, `factura_id` (FK), `tipo_item`, `referencia_id`, `descripcion`, `cantidad`, `precio_unitario`, `subtotal`.
- `proveedores`: Empresas proveedoras de insumos.
  - Campos: `id`, `nombre`, `nit`, `telefono`, `email`, `direccion`, `estado`.
- `proveedor_productos`: Catálogo de insumos de proveedores.
  - Campos: `id`, `proveedor_id` (FK), `nombre`, `descripcion`, `precio_unitario`, `categoria`.
- `cuentas_por_pagar`: Obligaciones con proveedores.
  - Campos: `id`, `proveedor_id` (FK), `numero_factura`, `monto`, `fecha_emision`, `fecha_vencimiento`, `estado`.

---

## 6. Funcionalidades Implementadas y Operativas

### A. Autenticación y Autorización
- Registro de clientes con validación Zod en cliente y servidor.
- Inicio de sesión con control de tasa de intentos (`express-rate-limit`).
- Consulta de sesión actual (`GET /api/auth/me`).
- Control de acceso basado en roles (RBAC) con 6 roles definidos y permisos granulares en el frontend.

### B. Módulo de Sedes y Configuración
- Catálogo administrativo de sucursales con soporte de imágenes multimedia.
- Configuración global de tasas de IVA y parámetros del hotel.

### C. Habitaciones y Reservas de Hospedaje
- Catálogo administrativo de tipos de habitación y habitaciones físicas.
- Búsqueda de disponibilidad en tiempo real por fechas y número de huéspedes (`GET /api/habitaciones/disponibles`), con exclusión de habitaciones en mantenimiento y prevención de traslapes.
- Creación de reservas para clientes con cálculo de tarifas e importes.
- Panel administrativo de reservas con filtros combinados (texto, sede, estado) y vista detallada profunda por URL directa.
- Aislamiento estricto de reservas: los clientes solo ven sus reservas; el personal administrativo puede auditar todas las sedes.

### D. Restaurante y Mesas
- Catálogo de mesas por sucursal con capacidades y ubicaciones.
- Flujo cliente de consulta y reserva de mesas con validación de horarios y estados.
- Gestión administrativa de reservas de restaurante con filtros y transiciones operativas.

### E. Amenidades e Instalaciones
- Catálogo de amenidades con horarios de apertura/cierre y capacidad máxima.
- Reserva de amenidades para clientes con generación dinámica de pases con código QR (`qrcode.react`).
- Auditoría administrativa de pases y control de asistencia.

### F. Actividades Recreativas
- Catálogo y administración de recursos deportivos/recreativos e instructores.
- Reservas de actividades por bloques horarios con cálculo automático de tarifas y vinculación opcional de instructor.
- Integración al carrito de compras y gestión administrativa de reservas.

### G. Bienestar y Spa
- Catálogo de servicios de spa y terapeutas especializados.
- Agendamiento de citas con validación de descansos bidireccionales entre citas para los terapeutas.
- Integración al carrito y panel administrativo de citas.

### H. Eventos y Salones
- Catálogo y administración de salones y servicios de banquetes/audiovisuales.
- Cotización en línea, cálculo automático de anticipo del 50% y adición/retiro de servicios complementarios.
- Blindaje financiero previo al cobro: row lock pesimista (`LOCK.UPDATE`) para evitar carreras entre mutaciones y pagos en curso.

### I. Carrito de Compras Unificado
- Creación de carrito activo con expiración configurable (por defecto 15 minutos).
- Soporte para múltiples ítems heterogéneos de reservas en un solo carrito.
- Aislamiento por usuario, retiro de ítems conservando la reserva en base de datos y prevención de duplicados concurrentes.

### J. Checkout y Pasarela Stripe
- Cálculo del saldo financiero en el backend (`GET /api/pagos/resumen`).
- Inicialización segura de Stripe Elements en el frontend.
- Idempotencia estricta en pagos con claves únicas en `sessionStorage` y backend.
- Flujo completo de cobro con tarjeta en modo prueba: éxito directo, rechazo y reintento en caliente sobre el mismo intento, autenticación 3D Secure (SCA).
- Endpoint `GET /api/pagos/intento-activo` para sincronizar intentos en curso sin duplicar cobros.
- Procesamiento de webhooks crudos (`/api/pagos/stripe/webhook`) con verificación criptográfica de firma `Stripe-Signature`.

---

## 7. Pendientes y Deuda Técnica

A continuación se detallan las áreas que aún no han sido completadas o que representan oportunidades de mejora:

- [ ] **TODO: Interfaz de Cliente para Boletos de Parque Temático:**
  - Las tablas (`boletos_parque`) y rutas backend (`/api/boletos-parque`) están programadas, pero el frontend no tiene páginas de compra ni catálogo de boletos para el parque temático.
- [ ] **TODO: Interfaz de Transporte:**
  - El backend cuenta con rutas y modelos para vehículos, choferes y reservas de transporte (`/api/reservas-transporte`), pero no existe módulo visual en el frontend para clientes ni para administración.
- [ ] **TODO: Interfaces Administrativas para Módulos con Placeholder:**
  - En `Frontend/src/app/router/AppRouter.tsx`, las siguientes rutas del panel administrativo siguen usando `ModulePlaceholderPage`:
    - `/admin/facturacion` (módulo de facturación y facturas electrónicas).
    - `/admin/pagos` (aprobación manual de transferencias bancarias y gestión administrativa de reembolsos).
    - `/admin/personal` (administración de empleados y turnos).
- [ ] **TODO: Pagos Fraccionados en el Frontend:**
  - El backend admite formalmente pagos de anticipo (`tipo_pago: "anticipo"`) y de saldo (`tipo_pago: "saldo"`), pero la vista actual de `CheckoutPage.tsx` está limitada a cobro total (`tipo_pago: "total"`).
- [ ] **TODO: Paginación en Servidor:**
  - Endpoints como `GET /api/reservas-habitacion` retornan todo el catálogo sin paginación (limit / offset). A medida que crezca el historial, se requerirá paginación del lado del servidor.
- [ ] **TODO: Cobertura Multimedia S3 en Resto de Módulos:**
  - La carga de imágenes a AWS S3 se encuentra integrada para sucursales (`sucursal.imagen_key`), pero habitaciones, amenidades y salones aún no cuentan con carga multimedia hacia S3.

---

## 8. Cómo Ejecutar el Proyecto

### Requisitos Previos
- **Node.js:** Versión 18+ o 20+ LTS.
- **Docker & Docker Compose:** Para levantar la base de datos PostgreSQL.
- **Git:** Para control de versiones.
- **Stripe CLI (opcional):** Para pruebas de webhooks locales.

### Variables de Entorno (Solo nombres de variables)

#### Backend (`backend/.env`)
```text
NODE_ENV
PORT
APP_TIMEZONE
CORS_ORIGINS
TRUST_PROXY
REQUEST_BODY_LIMIT
WEBHOOK_BODY_LIMIT
RATE_LIMIT_WINDOW_MS
AUTH_RATE_LIMIT_MAX
LOG_LEVEL
LOG_FORMAT
SERVICE_NAME
SLOW_QUERY_THRESHOLD_MS
EVENT_DEPOSIT_PERCENTAGE
TRANSPORT_BLOCK_MINUTES
CART_EXPIRATION_MINUTES
PARK_TICKET_PRICE_ADULT
PARK_TICKET_PRICE_CHILD
PARK_TICKET_PRICE_FAMILY
JWT_SECRET
JWT_EXPIRES_IN
DATABASE_URL
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
TEST_DATABASE_URL
STRIPE_ENABLED
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
AWS_REGION
AWS_S3_BUCKET
AWS_PROFILE
```

#### Frontend (`Frontend/.env`)
```text
VITE_API_BASE_URL
VITE_STRIPE_PUBLISHABLE_KEY
VITE_BRAND_LOGO_HORIZONTAL_COLOR
VITE_BRAND_LOGO_HORIZONTAL_BLANCO
VITE_BRAND_ISOTIPO_COLOR
```

### Comandos de Instalación y Ejecución

#### 1. Clonar e Instalar Dependencias
```bash
# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../Frontend
npm install
cd ..
```

#### 2. Base de Datos en Docker
```bash
# Iniciar contenedor de PostgreSQL (puerto 5432) y pgAdmin (puerto 5050)
docker compose up -d
```

#### 3. Migraciones y Semillas de Base de Datos
```bash
# Ejecutar migraciones en la base de datos habitual (hotel_db)
npm --prefix backend run db:migrate

# Ejecutar seeders iniciales
npm --prefix backend run db:seed
```

#### 4. Ejecución en Modo Desarrollo
```bash
# Terminal 1: Iniciar backend (puerto 4000)
npm --prefix backend run dev

# Terminal 2: Iniciar frontend (puerto 5173)
npm --prefix Frontend run dev
```

#### 5. Ejecución en Modo de Pruebas Manuales (Aislado)
```bash
# Iniciar backend conectado a la base de pruebas hotel_test_db (puerto 55432)
npm --prefix backend run dev:test
```

#### 6. Ejecución de Pruebas Automatizadas
```bash
# Pruebas unitarias del backend
npm --prefix backend run test:unit

# Pruebas de integración del backend
npm --prefix backend run test:integration

# Pruebas de tipos TypeScript en backend
npm --prefix backend run typecheck

# Pruebas unitarias y de componentes del frontend
npm --prefix Frontend test

# Pruebas de tipos TypeScript en frontend
npm --prefix Frontend run typecheck
```

#### 7. Sincronización de Contratos OpenAPI
```bash
# Regenerar contratos TypeScript en Frontend/src/api/generated/schema.ts
npm --prefix Frontend run api:generate
```

#### 8. Escuchar Webhooks de Stripe en Local
```bash
stripe listen --forward-to localhost:4000/api/pagos/stripe/webhook
```

---

## 9. Convenciones y Patrones de Diseño

- **Arquitectura en Capas (Backend):**
  - `Routes -> Middlewares (Auth / Validate) -> Controllers -> Services -> Models (Sequelize)`.
  - Los controladores no contienen lógica de negocio compleja ni consultas SQL directas; delegan a servicios transaccionales.
- **Tipado Estricto de API:**
  - El frontend no declara tipos manuales para peticiones y respuestas cuando existe un esquema en OpenAPI. Utiliza `paths['...']['...']['responses'][200]['content']['application/json']` o alias en `types.ts`.
- **Manejo de Estado en Frontend:**
  - Las consultas remotas utilizan TanStack Query (`useQuery`, `useMutation`).
  - Las claves de consulta (`queryKeys`) se centralizan y parametrizan con `userId` para evitar contaminación de caché entre sesiones.
- **Internacionalización y Textos:**
  - Todos los textos de interfaz se centralizan en `Frontend/src/i18n/es.ts` o archivos `textos.ts` por feature, manteniendo trato formal de "usted" y español neutro.
- **Idempotencia y Transaccionalidad:**
  - Operaciones de pago y mutaciones críticas deben contar con claves de idempotencia o ejecutarse dentro de transacciones Sequelize (`sequelize.transaction(...)`) con bloqueo pesimista (`lock: transaction.LOCK.UPDATE`) donde existan posibles carreras concurrentes.
- **Nomenclatura:**
  - Backend: PascalCase para modelos (`Usuario`, `ReservaHabitacion`), camelCase para métodos y servicios (`pago.service.ts`), snake_case para columnas de base de datos (`usuario_id`, `created_at`).
  - Frontend: PascalCase para componentes y páginas (`CheckoutPage.tsx`), camelCase para hooks y utilidades (`useSedes.ts`), UPPER_SNAKE_CASE para constantes de permisos o roles.

---

## 10. Notas Importantes y Limitaciones Técnicas

1. **Regla de Oro de QA (Invariantes de Ingeniería):**
   - Según se establece en `AGENTS.md`, **nunca** se debe modificar, debilitar o eliminar una prueba que expone un defecto real simplemente para hacerla pasar en verde. Se debe seguir el ciclo `RED -> FIX -> GREEN -> REGRESSION`.
2. **Seguridad de Base de Datos y Entornos:**
   - Las pruebas destructivas o de integración se ejecutan **exclusivamente** contra la base de datos `hotel_test_db` en el puerto `55432` o `55433`.
   - Existe un guardián de base de datos (`dbGuard.global.ts`) y validación estricta en `backend/src/config/env.ts` que detiene la ejecución si detecta que las pruebas intentan correr contra `hotel_db` (puerto 5432).
3. **Manejo del Body Crudo en Webhooks de Stripe:**
   - La ruta `/api/pagos/stripe/webhook` se monta con `express.raw({ type: "application/json" })` antes del middleware global `express.json()`. Modificar el orden de los middlewares romperá la verificación criptográfica del encabezado `Stripe-Signature`.
4. **Almacenamiento del Token JWT:**
   - El token de sesión se almacena en `sessionStorage` (se descarta al cerrar la pestaña). El backend no utiliza cookies de sesión.
5. **No Almacenar Datos Sensibles de Tarjeta:**
   - Bajo ninguna circunstancia se debe almacenar en la base de datos ni en el almacenamiento local el número de tarjeta, CVV o `client_secret` de Stripe. Solo se persisten identificadores de transacción externa (`payment_intent_id`).
6. **Manejo de Git:**
   - Nunca ejecutar comandos destructivos de git (`git push --force`, `git reset --hard`, `git clean -fd`) de forma automática sin solicitud o confirmación explícita del usuario.
