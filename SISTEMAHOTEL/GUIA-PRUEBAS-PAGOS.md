# 🏨 Hotel Hunapú — Guía de Pruebas: Módulo de Pagos y Reembolsos

**Proyecto:** Hotel Hunapú
**Rama:** `feature/pagos`
**Versión:** 2.0 (basada en lectura directa del código fuente)
**Herramienta:** Thunder Client (VS Code) o Postman
**Base URL:** `http://localhost:4000`
**Swagger UI:** `http://localhost:4000/api-docs`

---

## ⚙️ CONFIGURACIÓN INICIAL

### Variables de entorno obligatorias (archivo `backend/.env`)

```env
PORT=4000
JWT_SECRET=coloca_aqui_una_clave_larga_y_aleatoria
JWT_EXPIRES_IN=1h
DB_HOST=localhost
DB_USER=hotel_user
DB_PASSWORD=hotel_pass
DB_NAME=hotel_db
DB_PORT=5432
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_STRIPE_TEST
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET
CART_EXPIRATION_MINUTES=60
EVENT_DEPOSIT_PERCENTAGE=30
```

> ⚠️ `STRIPE_SECRET_KEY` debe empezar con `sk_test_` (modo prueba).
> ⚠️ `STRIPE_WEBHOOK_SECRET` se obtiene al iniciar Stripe CLI (ver Paso 0C).

---

### PASO 0A — Levantar el backend

**Terminal 1:**
```bash
cd backend
npm run dev
```
El servidor debe iniciar en: `http://localhost:4000`

---

### PASO 0B — Verificar que el servidor responde

```
GET http://localhost:4000/api/health
```
Sin headers, sin body.

**Respuesta esperada (200):**
```json
{ "status": "ok" }
```

---

### PASO 0C — Iniciar Stripe CLI (Terminal 2)

```bash
stripe listen --forward-to localhost:4000/api/pagos/stripe/webhook
```

Al iniciar, Stripe CLI imprime en pantalla:
```
> Ready! Your webhook signing secret is whsec_XXXXXXXXXXXXXXXXXXXXX
```

**Copia ese `whsec_...` y pégalo en `STRIPE_WEBHOOK_SECRET` en tu `.env`.**
Reinicia el servidor (Terminal 1) si ya estaba corriendo.

---

## A. ESTRUCTURA REAL DEL FLUJO

```
BASE DE DATOS VACÍA
        ↓
[ADMIN] Registrar usuario admin via /api/usuarios (requiere admin)
        ↓   ← Problema de bootstrap: ver Paso 1
[CLIENTE] POST /api/auth/register → crea usuario con rol "cliente"
        ↓
[ADMIN] PATCH /api/usuarios/:id/rol → asignar rol "admin" al primero
        ↓
[ADMIN] POST /api/auth/login → obtener JWT de admin
        ↓
[ADMIN] POST /api/sucursales → crear sucursal
        ↓
[ADMIN] POST /api/tipos-habitacion → crear tipo con tarifa_noche
        ↓
[ADMIN] POST /api/habitaciones → crear habitación disponible
        ↓
[CLIENTE] POST /api/auth/register → registrar cliente
        ↓
[CLIENTE] POST /api/auth/login → obtener JWT de cliente
        ↓
[CLIENTE] POST /api/reservas-habitacion → crear reserva (estado: pendiente)
        ↓
[CLIENTE] POST /api/carritos → crear carrito activo
        ↓
[CLIENTE] POST /api/carritos/:carritoId/items → agregar reserva al carrito
        ↓
[CLIENTE] POST /api/pagos → crear pago (efectivo/transferencia/tarjeta)
        ↓
[ADMIN] POST /api/pagos/:id/aprobar-transferencia (solo si método=transferencia)
        ↓
[ADMIN] POST /api/pagos/:id/reembolso → reembolso parcial o total
        ↓
[CUALQUIERA] GET /api/pagos/resumen?carrito_id=X → verificar saldo neto
        ↓
VERIFICAR ESTADOS / PROBAR ERRORES / IDEMPOTENCIA
```

---

## B. TABLA RESUMEN DE TODAS LAS RUTAS NECESARIAS

| Paso | Método | URL completa | Auth | Rol mínimo | Para qué |
|------|--------|--------------|------|-----------|----------|
| 1 | POST | `http://localhost:4000/api/auth/register` | No | — | Registrar primer usuario |
| 2 | POST | `http://localhost:4000/api/auth/login` | No | — | Obtener JWT |
| 3 | GET | `http://localhost:4000/api/usuarios` | Sí | admin | Ver ID del usuario recién creado |
| 4 | PATCH | `http://localhost:4000/api/usuarios/:id/rol` | Sí | admin | Promover a admin (bootstrap) |
| 5 | POST | `http://localhost:4000/api/sucursales` | Sí | admin | Crear sucursal |
| 6 | POST | `http://localhost:4000/api/tipos-habitacion` | Sí | admin/recep/ger_hab | Crear tipo de habitación con tarifa |
| 7 | POST | `http://localhost:4000/api/habitaciones` | Sí | admin/recep/ger_hab | Crear habitación disponible |
| 8 | POST | `http://localhost:4000/api/auth/register` | No | — | Registrar cliente de prueba |
| 9 | POST | `http://localhost:4000/api/auth/login` | No | — | Login del cliente |
| 10 | POST | `http://localhost:4000/api/reservas-habitacion` | Sí | cliente | Crear reserva de habitación |
| 11 | POST | `http://localhost:4000/api/carritos` | Sí | cliente | Crear carrito activo |
| 12 | POST | `http://localhost:4000/api/carritos/:carritoId/items` | Sí | cliente | Agregar reserva al carrito |
| 13 | POST | `http://localhost:4000/api/pagos` | Sí | cualquiera | Crear pago |
| 14 | POST | `http://localhost:4000/api/pagos/:id/aprobar-transferencia` | Sí | admin/recep/ger_hab | Aprobar pago por transferencia |
| 15 | GET | `http://localhost:4000/api/pagos/:id` | Sí | cualquiera | Ver estado del pago |
| 16 | GET | `http://localhost:4000/api/pagos/resumen?carrito_id=X` | Sí | cualquiera | Ver saldo neto (descuenta reembolsos) |
| 17 | POST | `http://localhost:4000/api/pagos/:id/reembolso` | Sí | admin/recep/ger_hab | Emitir reembolso parcial o total |
| 18 | GET | `http://localhost:4000/api/auth/me` | Sí | cualquiera | Verificar sesión activa |

---

## C. PRUEBAS DESDE BASE DE DATOS VACÍA

---

## PASO 1 — Registrar el primer usuario (será promovido a admin)

> **Problema de bootstrap:** `/api/usuarios` solo acepta admins. `/api/auth/register` siempre crea clientes.
> La solución es: registrar un usuario normalmente, y luego usar la base de datos para promoverlo.
> Si tienes acceso a psql o pgAdmin, puedes ejecutar directamente:
> ```sql
> UPDATE usuarios SET rol = 'admin' WHERE email = 'carlos.mendez@hotelhunapu.com';
> ```
> Si no tienes acceso directo a DB, usa el seeder de desarrollo (ver nota al final).

**Método:** `POST`
**URL:** `http://localhost:4000/api/auth/register`
**Headers:**
```
Content-Type: application/json
```
**Body:**
```json
{
  "nombre": "Carlos Méndez",
  "email": "carlos.mendez@hotelhunapu.com",
  "password": "Hunapu2026!",
  "telefono": "55110022"
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Usuario registrado correctamente",
  "data": {
    "id": 1,
    "nombre": "Carlos Méndez",
    "email": "carlos.mendez@hotelhunapu.com",
    "telefono": "55110022",
    "rol": "cliente",
    "activo": true
  }
}
```

**Guardar:**
```
USUARIO_ADMIN_ID = 1   ← (el valor real que devuelva tu respuesta)
```

---

## PASO 2 — Login del primer usuario (como cliente por ahora)

**Método:** `POST`
**URL:** `http://localhost:4000/api/auth/login`
**Headers:**
```
Content-Type: application/json
```
**Body:**
```json
{
  "email": "carlos.mendez@hotelhunapu.com",
  "password": "Hunapu2026!"
}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Inicio de sesión exitoso",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 1,
      "nombre": "Carlos Méndez",
      "email": "carlos.mendez@hotelhunapu.com",
      "telefono": "55110022",
      "rol": "cliente"
    }
  }
}
```

**Guardar:**
```
TOKEN_TEMPORAL = data.accessToken
```

---

## PASO 3 — Promover a administrador (vía base de datos)

Como el registro público siempre crea clientes, debes promover manualmente el primer admin.

**Opción A — Usando psql desde terminal:**
```bash
docker exec -it hotel_postgres psql -U hotel_user -d hotel_db -c "UPDATE usuarios SET rol = 'admin' WHERE email = 'carlos.mendez@hotelhunapu.com';"
```

**Opción B — Usando pgAdmin en http://localhost:5050:**
1. Conéctate con las credenciales de Docker.
2. Abre la tabla `usuarios`.
3. Edita el campo `rol` del usuario creado y cámbialo a `admin`.

**Opción C — Si tienes el seeder de desarrollo ya ejecutado:**
El usuario `dev.payment.admin@hotel.test` ya tiene rol `admin` con contraseña `Password123!`.
Puedes saltarte los pasos 1–3 y usar ese usuario directamente en los pasos que requieran admin.

---

## PASO 4 — Login como administrador

**Método:** `POST`
**URL:** `http://localhost:4000/api/auth/login`
**Headers:**
```
Content-Type: application/json
```
**Body:**
```json
{
  "email": "carlos.mendez@hotelhunapu.com",
  "password": "Hunapu2026!"
}
```

**Guardar:**
```
TOKEN_ADMIN = data.accessToken
```

> A partir de aquí, usa TOKEN_ADMIN en el header: `Authorization: Bearer TOKEN_ADMIN`

---

## PASO 5 — Crear sucursal (admin)

**Método:** `POST`
**URL:** `http://localhost:4000/api/sucursales`
**Headers:**
```
Authorization: Bearer TOKEN_ADMIN
Content-Type: application/json
```
**Body:**
```json
{
  "nombre": "Hotel Hunapú — Sede Central",
  "direccion": "7a Avenida 12-34, Zona 9",
  "ciudad": "Guatemala",
  "telefono": "23601500"
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 1,
    "nombre": "Hotel Hunapú — Sede Central",
    "ciudad": "Guatemala",
    "activa": true
  }
}
```

**Guardar:**
```
SUCURSAL_ID = data.id
```

---

## PASO 6 — Crear tipo de habitación (admin)

> Aquí se define la `tarifa_noche`. El backend la usará para calcular el total de cualquier reserva.
> El cliente nunca envía el precio.

**Método:** `POST`
**URL:** `http://localhost:4000/api/tipos-habitacion`
**Headers:**
```
Authorization: Bearer TOKEN_ADMIN
Content-Type: application/json
```
**Body:**
```json
{
  "nombre": "Suite Junior",
  "capacidad_maxima": 2,
  "tarifa_noche": 1000,
  "descripcion": "Suite con vista al jardín, cama king size y jacuzzi"
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 1,
    "nombre": "Suite Junior",
    "capacidad_maxima": 2,
    "tarifa_noche": "1000.00"
  }
}
```

**Guardar:**
```
TIPO_HABITACION_ID = data.id
```

---

## PASO 7 — Crear habitación disponible (admin)

**Método:** `POST`
**URL:** `http://localhost:4000/api/habitaciones`
**Headers:**
```
Authorization: Bearer TOKEN_ADMIN
Content-Type: application/json
```
**Body:**
```json
{
  "sucursal_id": SUCURSAL_ID,
  "tipo_habitacion_id": TIPO_HABITACION_ID,
  "numero": "201",
  "estado": "disponible"
}
```

Ejemplo real:
```json
{
  "sucursal_id": 1,
  "tipo_habitacion_id": 1,
  "numero": "201",
  "estado": "disponible"
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 1,
    "numero": "201",
    "estado": "disponible",
    "sucursal_id": 1,
    "tipo_habitacion_id": 1
  }
}
```

**Guardar:**
```
HABITACION_ID = data.id
```

---

## PASO 8 — Registrar cliente de prueba

**Método:** `POST`
**URL:** `http://localhost:4000/api/auth/register`
**Headers:**
```
Content-Type: application/json
```
**Body:**
```json
{
  "nombre": "Andrea López",
  "email": "andrea.lopez@hotelhunapu.com",
  "password": "Hunapu2026!",
  "telefono": "55334411"
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 2,
    "nombre": "Andrea López",
    "email": "andrea.lopez@hotelhunapu.com",
    "rol": "cliente",
    "activo": true
  }
}
```

**Guardar:**
```
CLIENTE_ID = data.id
```

---

## PASO 9 — Login como cliente

**Método:** `POST`
**URL:** `http://localhost:4000/api/auth/login`
**Headers:**
```
Content-Type: application/json
```
**Body:**
```json
{
  "email": "andrea.lopez@hotelhunapu.com",
  "password": "Hunapu2026!"
}
```

**Guardar:**
```
TOKEN_CLIENTE = data.accessToken
```

---

## PASO 10 — Crear reserva de habitación (cliente)

> **Regla de negocio:** El cliente NO envía `usuario_id` ni `total`.
> El backend toma `usuario_id` del JWT y calcula `total = noches × tarifa_noche`.
> Ejemplo: Suite Junior Q1,000/noche × 2 noches = **Q2,000 total**.
> La reserva se crea en estado `"pendiente"`.

**Método:** `POST`
**URL:** `http://localhost:4000/api/reservas-habitacion`
**Headers:**
```
Authorization: Bearer TOKEN_CLIENTE
Content-Type: application/json
```
**Body:**
```json
{
  "habitacion_id": HABITACION_ID,
  "fecha_entrada": "2027-03-10",
  "fecha_salida": "2027-03-12",
  "numero_huespedes": 2
}
```

Ejemplo real:
```json
{
  "habitacion_id": 1,
  "fecha_entrada": "2027-03-10",
  "fecha_salida": "2027-03-12",
  "numero_huespedes": 2
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 1,
    "usuario_id": 2,
    "habitacion_id": 1,
    "fecha_entrada": "2027-03-10",
    "fecha_salida": "2027-03-12",
    "numero_huespedes": 2,
    "estado": "pendiente",
    "total": "2000.00"
  }
}
```

**Guardar:**
```
RESERVA_ID = data.id
TOTAL_RESERVA = data.total   ← en el ejemplo: 2000
```

---

## PASO 11 — Crear carrito (cliente)

> **Regla:** Un cliente solo puede tener UN carrito activo a la vez.
> El carrito expira automáticamente según `CART_EXPIRATION_MINUTES` del `.env`.

**Método:** `POST`
**URL:** `http://localhost:4000/api/carritos`
**Headers:**
```
Authorization: Bearer TOKEN_CLIENTE
Content-Type: application/json
```
**Body:** (vacío — el body es `{}` o puede omitirse)
```json
{}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 1,
    "usuario_id": 2,
    "estado": "activo",
    "expira_en": "2027-01-01T13:00:00.000Z"
  }
}
```

**Guardar:**
```
CARRITO_ID = data.id
```

> ⚠️ Si obtienes `409 CART_ALREADY_ACTIVE`, el cliente ya tiene un carrito activo.
> Consulta el carrito actual con: `GET /api/carritos/actual`

---

## PASO 12 — Agregar reserva al carrito (cliente)

> El cliente solo puede agregar ítems al carrito con rol `"cliente"`.
> `tipo_item` acepta: `"habitacion"`, `"evento"`, `"transporte"`, `"actividad"`, `"amenidad"`, `"mesa"`, `"boleto_parque"`, `"cita_spa"`.

**Método:** `POST`
**URL:** `http://localhost:4000/api/carritos/CARRITO_ID/items`
**Headers:**
```
Authorization: Bearer TOKEN_CLIENTE
Content-Type: application/json
```
**Body:**
```json
{
  "tipo_item": "habitacion",
  "referencia_id": RESERVA_ID
}
```

Ejemplo real:
```json
{
  "tipo_item": "habitacion",
  "referencia_id": 1
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 1,
    "carrito_id": 1,
    "tipo_item": "habitacion",
    "referencia_id": 1,
    "descripcion": "Suite Junior — Hab. 201 (10/03/2027 - 12/03/2027)",
    "precio": "2000.00",
    "cantidad": 1
  }
}
```

---

## PASO 13 — Ver resumen antes de pagar

**Método:** `GET`
**URL:** `http://localhost:4000/api/pagos/resumen?carrito_id=CARRITO_ID`
**Headers:**
```
Authorization: Bearer TOKEN_CLIENTE
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "total": 2000,
    "anticipo_requerido": null,
    "aprobado": 0,
    "saldo": 2000
  }
}
```

> `aprobado: 0` confirma que aún no hay pagos. `saldo: 2000` es lo que falta pagar.

---

## PASO 14 — Crear pago en efectivo (total)

> **Regla de negocio para habitaciones:** El monto debe ser igual al saldo total. No se permiten pagos parciales.
> El campo `idempotency_key` es opcional pero recomendado. Debe ser único por operación.

**Método:** `POST`
**URL:** `http://localhost:4000/api/pagos`
**Headers:**
```
Authorization: Bearer TOKEN_CLIENTE
Content-Type: application/json
```
**Body:**
```json
{
  "carrito_id": CARRITO_ID,
  "monto": 2000,
  "metodo": "efectivo",
  "tipo_pago": "total",
  "moneda": "GTQ",
  "idempotency_key": "andrea-reserva-1-efectivo-001"
}
```

**Valores válidos para `metodo`:** `"efectivo"`, `"transferencia"`, `"tarjeta"`
**Valores válidos para `tipo_pago`:** `"total"`, `"anticipo"`, `"saldo"`
**Valor válido para `moneda`:** solo `"GTQ"`

**Respuesta esperada (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Pago creado correctamente",
  "data": {
    "id": 1,
    "carrito_id": 1,
    "monto": "2000.00",
    "metodo": "efectivo",
    "estado": "aprobado",
    "tipo_pago": "total",
    "moneda": "GTQ",
    "pasarela": null
  }
}
```

**Guardar:**
```
PAGO_ID = data.id
```

> Estado final: `"aprobado"` para efectivo.
> Estado final para transferencia: `"pendiente"` (requiere aprobación manual del admin).
> Estado final para tarjeta: `"procesando"` (espera confirmación de Stripe vía webhook).

---

## PASO 15 — Pago con transferencia bancaria

**Método:** `POST`
**URL:** `http://localhost:4000/api/pagos`
**Headers:**
```
Authorization: Bearer TOKEN_CLIENTE
Content-Type: application/json
```
**Body:**
```json
{
  "carrito_id": CARRITO_ID,
  "monto": 2000,
  "metodo": "transferencia",
  "tipo_pago": "total",
  "moneda": "GTQ",
  "idempotency_key": "andrea-reserva-1-transferencia-001"
}
```

**Respuesta esperada (201):** `"estado": "pendiente"`

---

## PASO 16 — Aprobar transferencia pendiente (solo admin/recep/ger_hab)

**Método:** `POST`
**URL:** `http://localhost:4000/api/pagos/PAGO_ID/aprobar-transferencia`
**Headers:**
```
Authorization: Bearer TOKEN_ADMIN
```
**Body:** ninguno

**Respuesta esperada (200):** El pago pasa a `"estado": "aprobado"`.

---

## PASO 17 — Pago con tarjeta (Stripe Test Mode)

**Método:** `POST`
**URL:** `http://localhost:4000/api/pagos`
**Headers:**
```
Authorization: Bearer TOKEN_CLIENTE
Content-Type: application/json
```
**Body:**
```json
{
  "carrito_id": CARRITO_ID,
  "monto": 2000,
  "metodo": "tarjeta",
  "tipo_pago": "total",
  "moneda": "GTQ",
  "idempotency_key": "andrea-reserva-1-tarjeta-001"
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "payment_intent_id": "pi_XXXXXXXXXXXXXXXXXXXXX",
    "client_secret": "pi_XXXXX_secret_YYYYY",
    "estado": "procesando",
    "monto": "2000.00",
    "moneda": "GTQ"
  }
}
```

**Guardar:**
```
PAYMENT_INTENT_ID = data.payment_intent_id
```

> El pago queda en `"procesando"` hasta que Stripe envíe el webhook `payment_intent.succeeded`.
> Con Stripe CLI activo (Terminal 2), ese evento llega automáticamente si confirmas el PaymentIntent desde el Dashboard de Stripe o usando la librería de Stripe.

**Tarjetas de prueba de Stripe (usa en el Dashboard o SDK):**
- ✅ Pago exitoso: `4242 4242 4242 4242` — cualquier fecha futura — cualquier CVC
- ❌ Pago rechazado: `4000 0000 0000 0002` — cualquier fecha futura — cualquier CVC

---

## PASO 18 — Consultar estado del pago

**Método:** `GET`
**URL:** `http://localhost:4000/api/pagos/PAGO_ID`
**Headers:**
```
Authorization: Bearer TOKEN_CLIENTE
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": 1,
    "carrito_id": 1,
    "monto": "2000.00",
    "metodo": "efectivo",
    "estado": "aprobado",
    "tipo_pago": "total",
    "moneda": "GTQ",
    "fecha_pago": "2027-01-15T19:00:00.000Z"
  }
}
```

---

## PASO 19 — Consultar resumen después del pago

**Método:** `GET`
**URL:** `http://localhost:4000/api/pagos/resumen?carrito_id=CARRITO_ID`
**Headers:**
```
Authorization: Bearer TOKEN_CLIENTE
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "total": 2000,
    "anticipo_requerido": null,
    "aprobado": 2000,
    "saldo": 0
  }
}
```

> `aprobado: 2000` y `saldo: 0` confirman pago completo.

---

## PASO 20 — Reembolso parcial #1 (admin/recep/ger_hab)

> **Regla:** Solo `admin`, `recepcionista` y `gerente_habitaciones` pueden reembolsar.
> **`idempotency_key` es OBLIGATORIO** para pagos manuales (efectivo/transferencia).
> Si envías la misma `idempotency_key` dos veces, el sistema devuelve el reembolso original sin crear uno nuevo.

**Método:** `POST`
**URL:** `http://localhost:4000/api/pagos/PAGO_ID/reembolso`
**Headers:**
```
Authorization: Bearer TOKEN_ADMIN
Content-Type: application/json
```
**Body:**
```json
{
  "monto": 500,
  "motivo": "Ajuste por cambio de fechas solicitado por el huésped",
  "idempotency_key": "reembolso-andrea-pago-1-parcial-001"
}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Reembolso procesado correctamente",
  "data": {
    "id": 1,
    "pago_id": 1,
    "monto": "500.00",
    "moneda": "GTQ",
    "motivo": "Ajuste por cambio de fechas solicitado por el huésped",
    "estado": "aprobado",
    "fecha_reembolso": "2027-01-15T19:05:00.000Z",
    "id_reembolso_externo": "reembolso-andrea-pago-1-parcial-001"
  }
}
```

**Guardar:**
```
REEMBOLSO_ID_1 = data.id
```

> El Pago #1 pasa a `"estado": "reembolsado_parcial"`.

---

## PASO 21 — Verificar resumen después del primer reembolso

**Método:** `GET`
**URL:** `http://localhost:4000/api/pagos/resumen?carrito_id=CARRITO_ID`
**Headers:**
```
Authorization: Bearer TOKEN_CLIENTE
```

**Respuesta esperada (200):**
```json
{
  "data": {
    "total": 2000,
    "anticipo_requerido": null,
    "aprobado": 1500,
    "saldo": 500
  }
}
```

> `aprobado: 1500` = Q2,000 pagado − Q500 reembolsado.

---

## PASO 22 — Reembolso parcial #2 (Q500 más)

**Método:** `POST`
**URL:** `http://localhost:4000/api/pagos/PAGO_ID/reembolso`
**Headers:**
```
Authorization: Bearer TOKEN_ADMIN
Content-Type: application/json
```
**Body:**
```json
{
  "monto": 500,
  "motivo": "Segunda compensación aprobada por gerencia",
  "idempotency_key": "reembolso-andrea-pago-1-parcial-002"
}
```

**Respuesta esperada (200):** El pago sigue en `reembolsado_parcial`. Acumulado: Q1,000 reembolsados.

---

## PASO 23 — Reembolso final (Q1,000 restantes)

**Método:** `POST`
**URL:** `http://localhost:4000/api/pagos/PAGO_ID/reembolso`
**Headers:**
```
Authorization: Bearer TOKEN_ADMIN
Content-Type: application/json
```
**Body:**
```json
{
  "monto": 1000,
  "motivo": "Cancelación total de la reserva aprobada por gerencia general",
  "idempotency_key": "reembolso-andrea-pago-1-total-003"
}
```

**Respuesta esperada (200):**
El Pago #1 pasa a `"estado": "reembolsado"`. Total reembolsado: Q2,000.

---

## PASO 24 — Verificar resumen final

**Método:** `GET`
**URL:** `http://localhost:4000/api/pagos/resumen?carrito_id=CARRITO_ID`

**Respuesta esperada (200):**
```json
{
  "data": {
    "total": 2000,
    "anticipo_requerido": null,
    "aprobado": 0,
    "saldo": 2000
  }
}
```

> `aprobado: 0` confirma que el 100% fue reembolsado.

---

## D. PRUEBAS DE ERRORES Y CASOS BORDE

---

### ERROR 1 — Pago parcial en habitación (DEBE FALLAR)

**Método:** `POST`
**URL:** `http://localhost:4000/api/pagos`
**Headers:** `Authorization: Bearer TOKEN_CLIENTE`, `Content-Type: application/json`
**Body:**
```json
{
  "carrito_id": CARRITO_ID,
  "monto": 1000,
  "metodo": "efectivo",
  "tipo_pago": "anticipo",
  "moneda": "GTQ",
  "idempotency_key": "andrea-parcial-invalido-001"
}
```

**Respuesta esperada (409):**
```json
{
  "success": false,
  "statusCode": 409,
  "code": "ROOM_PAYMENT_MUST_BE_FULL",
  "message": "Las reservas de habitación requieren pago total. Monto requerido: Q2000.00"
}
```

---

### ERROR 2 — Reembolso que excede el saldo (DEBE FALLAR)

**Método:** `POST`
**URL:** `http://localhost:4000/api/pagos/PAGO_ID/reembolso`
**Headers:** `Authorization: Bearer TOKEN_ADMIN`, `Content-Type: application/json`
**Body:**
```json
{
  "monto": 9999,
  "motivo": "Intento de exceder el saldo",
  "idempotency_key": "reembolso-overflow-001"
}
```

**Respuesta esperada (409):**
```json
{
  "success": false,
  "statusCode": 409,
  "code": "REFUND_EXCEEDS_BALANCE",
  "message": "El monto del reembolso excede el saldo pagado disponible"
}
```

---

### ERROR 3 — Cliente intenta reembolsar (DEBE FALLAR con 403)

**Método:** `POST`
**URL:** `http://localhost:4000/api/pagos/PAGO_ID/reembolso`
**Headers:** `Authorization: Bearer TOKEN_CLIENTE`, `Content-Type: application/json`
**Body:**
```json
{
  "monto": 500,
  "motivo": "Cliente intentando reembolsarse",
  "idempotency_key": "cliente-reembolso-forbidden-001"
}
```

**Respuesta esperada (403):**
```json
{
  "success": false,
  "statusCode": 403,
  "code": "INSUFFICIENT_PERMISSIONS",
  "message": "No tiene permisos para realizar esta operación"
}
```

---

### ERROR 4 — Reembolsar un pago ya completamente reembolsado (DEBE FALLAR)

Después de completar el reembolso total (Paso 23), intenta otro reembolso:

**Body:**
```json
{
  "monto": 100,
  "motivo": "Intento sobre pago ya reembolsado",
  "idempotency_key": "reembolso-ya-reembolsado-001"
}
```

**Respuesta esperada (409):**
```json
{
  "success": false,
  "statusCode": 409,
  "code": "PAYMENT_NOT_REFUNDABLE",
  "message": "El pago no se encuentra en un estado reembolsable"
}
```

> Un pago en estado `"reembolsado"` no puede recibir más reembolsos. Solo acepta pagos en `"aprobado"` o `"reembolsado_parcial"`.

---

### ERROR 5 — Solicitud sin JWT (DEBE FALLAR con 401)

**Método:** `GET`
**URL:** `http://localhost:4000/api/pagos`
**Headers:** ninguno

**Respuesta esperada (401):**
```json
{
  "success": false,
  "statusCode": 401,
  "code": "AUTH_TOKEN_REQUIRED",
  "message": "Debe iniciar sesión para acceder a este recurso"
}
```

---

### ERROR 6 — JWT con formato inválido (DEBE FALLAR con 401)

**Headers:**
```
Authorization: InvalidToken abc123
```

**Respuesta esperada (401):**
```json
{
  "success": false,
  "statusCode": 401,
  "code": "INVALID_AUTH_FORMAT",
  "message": "El token de autenticación no tiene un formato válido"
}
```

---

### ERROR 7 — Monto ausente en reembolso (DEBE FALLAR con 400)

**Body:**
```json
{
  "motivo": "Sin monto",
  "idempotency_key": "sin-monto-001"
}
```

**Respuesta esperada (400):**
```json
{
  "success": false,
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Los datos enviados no tienen el formato esperado"
}
```

---

### ERROR 8 — idempotency_key ausente en reembolso manual (DEBE FALLAR con 400)

**Body:**
```json
{
  "monto": 500,
  "motivo": "Sin llave de idempotencia"
}
```

**Respuesta esperada (400):** `VALIDATION_ERROR` — campo `idempotency_key` es requerido.

---

## E. PRUEBA DE IDEMPOTENCIA

La idempotencia garantiza que si el mismo request se envía dos veces con la misma `idempotency_key`, no se crea un segundo reembolso.

### Prueba:

1. Envía el Paso 20 (reembolso Q500 con `idempotency_key: "reembolso-andrea-pago-1-parcial-001"`).
2. Envía **exactamente el mismo request nuevamente**.

**Resultado esperado en ambas llamadas:** respuesta `200` con el mismo `id` de reembolso.
**En la base de datos:** solo existe UN reembolso con esa llave.

> Si quieres hacer un **segundo reembolso legítimo** del mismo monto, cambia la `idempotency_key`:
> ```json
> "idempotency_key": "reembolso-andrea-pago-1-parcial-002"
> ```

---

## F. WEBHOOK DE STRIPE

### Flujo completo con 3 terminales

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Stripe CLI:**
```bash
stripe listen --forward-to localhost:4000/api/pagos/stripe/webhook
```

**Terminal 3 — Comandos Stripe:**
```bash
# Ver eventos recientes de tipo refund.created
stripe events list --type=refund.created --limit=10

# Reenviar un evento específico al backend (para probar idempotencia del webhook)
stripe events resend evt_XXXXXXXXXXXXXXXXXXXXXXXXX
```

### Endpoint del webhook

```
POST http://localhost:4000/api/pagos/stripe/webhook
```

- No requiere JWT.
- Requiere el header `Stripe-Signature` (lo agrega Stripe CLI automáticamente).
- Verifica la firma con `STRIPE_WEBHOOK_SECRET`.
- El body debe llegar como bytes crudos (`express.raw`), no como JSON.

### Eventos procesados

| Evento Stripe | Qué hace el backend |
|---------------|---------------------|
| `payment_intent.succeeded` | Pago pasa a `aprobado` |
| `payment_intent.payment_failed` | Pago pasa a `rechazado` |
| `payment_intent.canceled` | Pago pasa a `cancelado` |
| `refund.created` | Crea Reembolso local (si no existe por `id_reembolso_externo`) |
| `refund.updated` | Actualiza estado del Reembolso local |
| `refund.failed` | Actualiza estado a `rechazado` y recalcula estado del Pago |

### Qué ver en cada terminal al reenviar un evento

**Terminal 2 (Stripe CLI):**
```
--> refund.created [evt_XXXXX]
<-- [200] POST http://localhost:4000/api/pagos/stripe/webhook
```

**Terminal 1 (Backend):** no debe mostrar errores.

**Thunder Client:** consultar `GET /api/pagos/PAGO_ID` — el estado debe reflejar el cambio.

---

## G. ESTADOS DEL SISTEMA

### Estados de un Pago (`estado` en tabla `pagos`)

| Estado | Cuándo ocurre |
|--------|---------------|
| `pendiente` | Transferencia bancaria creada, esperando aprobación manual |
| `procesando` | Pago con tarjeta creado, esperando confirmación de Stripe |
| `aprobado` | Pago confirmado (efectivo aprobado inmediatamente, tarjeta tras webhook) |
| `rechazado` | Stripe reportó fallo en el pago |
| `cancelado` | PaymentIntent cancelado en Stripe |
| `reembolsado_parcial` | Se reembolsó parte del monto, aún hay dinero aprobado neto |
| `reembolsado` | El monto neto reembolsado iguala o supera el monto total del pago |

### Estados de un Reembolso (`estado` en tabla `reembolsos`)

| Estado | Cuándo ocurre |
|--------|---------------|
| `pendiente` | Reembolso Stripe en proceso |
| `aprobado` | Reembolso confirmado (manual o por Stripe) |
| `rechazado` | Stripe reportó fallo en el reembolso |

### Estados de una Reserva de Habitación

| Estado | Cuándo ocurre |
|--------|---------------|
| `pendiente` | Recién creada, sin pago |
| `confirmada` | Pago aprobado |
| `cancelada` | Cancelada manualmente |
| `finalizada` | Estadía completada |
| `expirada` | Venció sin pago |

---

## H. FLUJO DE EVENTOS (ANTICIPO) — SOLO PARA REFERENCIA

A diferencia de las habitaciones, los eventos sí admiten anticipo + saldo.

### Resumen del flujo de evento:
1. `POST /api/reservas-evento` → crea reserva con estado `cotizacion` y anticipo del 30%.
2. `POST /api/carritos` → carrito nuevo.
3. `POST /api/carritos/:id/items` → agrega el evento.
4. `POST /api/pagos` con `tipo_pago: "anticipo"` → paga el 30%.
5. El carrito queda disponible para el segundo pago.
6. `POST /api/pagos` con `tipo_pago: "saldo"` → paga el 70% restante.

---

## I. NOTAS FINALES

1. **`idempotency_key` para pagos:** es opcional en `POST /api/pagos`, pero recomendado para evitar pagos duplicados si el cliente reintenta.

2. **`idempotency_key` para reembolsos:** es **OBLIGATORIO** en `POST /api/pagos/:id/reembolso` cuando el método de pago es `"efectivo"` o `"transferencia"`. Usa cadenas únicas descriptivas:
   - ✅ `"reembolso-andrea-pago-1-parcial-001"`
   - ❌ `"key1"` (muy corto, colisiones probables)

3. **El cliente nunca envía precios ni usuario_id.** El backend los obtiene del JWT y de la base de datos.

4. **Swagger interactivo:** `http://localhost:4000/api-docs` — documenta todos los endpoints con ejemplos.

5. **Para pruebas con Stripe en modo test**, nunca uses tarjetas reales. Solo usa las tarjetas de prueba de Stripe documentadas en el Paso 17.

6. **`CART_EXPIRATION_MINUTES`** en `.env` controla cuánto tiempo tiene el carrito. Sube el valor si necesitas más tiempo durante pruebas.
