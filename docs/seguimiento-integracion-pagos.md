# Seguimiento de Integración de Pagos (BE-014)

## Estado actual
- **Estado de BE-014:** Integración / Verificación pendiente.
- **Razón del bloqueo interactivo:**
  1. Ausencia de `VITE_STRIPE_PUBLISHABLE_KEY` en `Frontend/.env` (`pk_test_...` correspondiente a la cuenta de prueba activa `acct_1U1gMOLtJcRjbnjR`).
  2. Ausencia de navegador web interactivo en la sesión para interactuar manualmente con Stripe Elements e ingresar desafíos 3DS de prueba.
- **Aclaración sobre Webhooks y Puerto del Servidor:**
  - La presencia de `STRIPE_WEBHOOK_SECRET` en `backend/.env` valida que el formato es reconocido, pero **el secreto de firma debe corresponder al listener activo** generado en cada sesión de Stripe CLI.
  - **Puerto efectivo del servidor backend:** Puerto **`4000`** (`PORT` en `backend/src/config/env.ts` y consumido por el frontend en `Frontend/src/app/config/env.ts` como `http://localhost:4000/api`).
  - **Ruta real del Webhook:** `/api/pagos/stripe/webhook` (con parser `express.raw({ type: "application/json" })` en `backend/src/app.ts`, ejecutado antes de los middlewares JSON).
  - **Comando exacto para reenvío local con Stripe CLI:**
    ```bash
    stripe listen --forward-to localhost:4000/api/pagos/stripe/webhook
    ```
    *(Este comando genera al iniciar una línea con el secreto de firma efímero `whsec_...`, el cual debe coincidir con el `STRIPE_WEBHOOK_SECRET` del backend para validar la firma de eventos).*

## Configuración local verificada (sin secretos)
- **Backend (`backend/.env`):**
  - `PORT`: 4000 (puerto efectivo del servidor Express).
  - `STRIPE_SECRET_KEY`: Configurada en modo de prueba (`sk_test_...`).
  - `STRIPE_WEBHOOK_SECRET`: Configurada (`whsec_...`).
  - Base de datos de pruebas: `hotel_test_db` en puerto 55432 (disponible y verificada).
- **Frontend (`Frontend/.env`):**
  - `VITE_API_BASE_URL`: `http://localhost:4000/api`.
  - `VITE_STRIPE_PUBLISHABLE_KEY`: **Ausente / no configurada**. Impide a Stripe.js cargar el iframe de Elements en el navegador.
- **Herramientas de entorno:**
  - Stripe CLI disponible en `/usr/local/bin/stripe` (autenticado como Administrador en `Entorno de prueba de tecnologia y computacion · sandbox acct_1U1gMOLtJcRjbnjR`).
  - Base de datos `hotel_postgres_test` activa en puerto `55432`.
  - Servidor Express backend en reposo (no se dejaron procesos demonios no controlados activos).

## Cobertura automatizada implementada y verificada
Ejecutada con el runner del proyecto (**Vitest**, `npm --prefix backend test tests/pagos/pago.intentoActivo.test.ts` y suites de frontend):
1. **Rechazo y recuperación:** Recuperación de PaymentIntent en `requires_payment_method` tras rechazo de tarjeta (`pago.intentoActivo.test.ts` casos 3 y 4; `CheckoutPage.test.tsx`).
2. **Protección contra cobros incompatibles:** Si Stripe confirma éxito mientras el webhook local sigue en proceso o rechazado, `committedOrProcessingExposure` bloquea un cobro concurrente excedente con error 409 `PAYMENT_EXCEEDS_BALANCE` (`pago.intentoActivo.test.ts` casos 8, 9, 10; `CheckoutPage.test.tsx`).
3. **Cancelación externa:** Reconciliación segura de cancelaciones liberando reservas o carritos solo si no hay aprobación concurrente (`pago.intentoActivo.test.ts` casos 7 y 10; `PagoResultadoPage.test.tsx` casos 3 y 4).
4. **Pago local sin identificador externo:** Distinción y recuperación sin fallar (`pago.intentoActivo.test.ts` caso 5; `CheckoutPage.test.tsx`).
5. **Cambio de importe con intento pendiente:** Verificación estricta contra saldo de servidor que impide confirmar un intento obsoleto o crear otro cobro mientras esté activo (`CheckoutPage.test.tsx`).
6. **Aislamiento por usuario e idempotencia:** Identificación con `userId` en claves de consulta y persistencia de clave de idempotencia (`PagoResultadoPage.test.tsx` casos 1, 2, 5, 6; `pago.idempotency.concurrency.test.ts`).
7. **Fin del polling sin falso positivo:** Manejo de estado procesando y límite de sondeo sin asumir estados no comprobados (`PagoResultadoPage.test.tsx` caso 8).

## Distinción de comprobaciones y estado de los escenarios

| Escenario | Comprobación en navegador real con Stripe de prueba | Cobertura automatizada | Estado técnico |
|---|---|---|---|
| **A. Pago exitoso** | Pendiente (falta clave pública frontend y navegador interactivo) | Sí (`pago.intentoActivo.test.ts`, `CheckoutPage.test.tsx`) | Lógica integrada y tipada; pendiente verificación interactiva E2E. |
| **B. Autenticación 3D Secure** | Pendiente (requiere desafío modal en navegador interactivo) | Sí (manejo de `requires_action` en `CheckoutPage.tsx`) | Manejo de acción requerido cubierto con mocks de Stripe.js. |
| **C. Tarjeta rechazada y recuperación** | Pendiente | Sí (`pago.intentoActivo.test.ts` casos 3 y 4; `CheckoutPage.test.tsx`) | Intento se mantiene recuperable sin crear cobro duplicado ni desbordar saldo. |
| **D. Recarga o regreso al checkout con intento pendiente** | Pendiente | Sí (`pago.intentoActivo.test.ts` caso 1; `CheckoutPage.test.tsx`) | `GET /api/pagos/intento-activo` recupera client_secret del intento pendiente sin crear nuevo pago. |
| **E. Protección contra doble envío** | Pendiente | Sí (`pago.idempotency.concurrency.test.ts` y caso 8 de `pago.intentoActivo.test.ts`) | Bloqueo por clave de idempotencia y control transaccional de exposición de saldo. |

---

## Guía para la Comprobación Manual en Vivo (Paso a Paso)

Una vez que el usuario agregue la clave pública en `Frontend/.env`:

1. **Configurar la clave pública en el frontend:**
   Añadir en `Frontend/.env`:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # Clave pública de prueba de acct_1U1gMOLtJcRjbnjR
   ```
2. **Iniciar el reenvío de webhooks locales con Stripe CLI:**
   En una terminal independiente:
   ```bash
   stripe listen --forward-to localhost:4000/api/pagos/stripe/webhook
   ```
   *Nota: Copiar el secreto `whsec_...` que imprime `stripe listen` y actualizarlo temporalmente en `backend/.env` (`STRIPE_WEBHOOK_SECRET=whsec_...`) para que coincida exactamente con la sesión activa.*
3. **Iniciar el backend apuntando a hotel_test_db:**
   ```bash
   NODE_ENV=test TEST_DATABASE_URL=postgres://hotel_user:hotel_password@localhost:55432/hotel_test_db npm --prefix backend run dev
   ```
4. **Iniciar el frontend:**
   ```bash
   npm --prefix Frontend run dev
   ```
5. **Ejecutar el recorrido interactivo en navegador:**
   - Iniciar sesión como cliente (`/login`).
   - Crear una reserva de habitación en `/reservar` y añadirla al carrito.
   - Navegar a `/checkout`.
   - Pulsar "Preparar pago" (acción explícita para crear el intento).
   - Probar tarjetas oficiales de prueba de Stripe:
     - **Éxito:** `4242 4242 4242 4242` (cualquier fecha futura y CVC).
     - **3D Secure:** `4000 0027 6000 3184` (superar el modal de autenticación de prueba).
     - **Rechazo:** `4002 0000 0000 0002` (verificar que no se duplica el cobro y permite reintentar con otra tarjeta).
   - Tras completar la confirmación, verificar que la pantalla redirige a `/pagos/:id/resultado`, el webhook confirma el evento en consola y la reserva cambia a estado `confirmada` y carrito a `pagado`.
