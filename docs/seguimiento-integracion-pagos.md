# Seguimiento de Integración de Pagos (BE-014)

Este documento registra el progreso, la arquitectura técnica, las decisiones de diseño y las verificaciones manuales y automatizadas correspondientes al lote de pagos con Stripe Checkout y Payment Element (**BE-014**).

---

## Distinción de comprobaciones y estado de los escenarios

| Escenario | Comprobación en navegador real con Stripe de prueba | Cobertura automatizada | Evidencia consultada y estado técnico |
|---|---|---|---|
| **A. Pago exitoso** | **Comprobado en vivo** | Sí (`pago.intentoActivo.test.ts`, `CheckoutPage.test.tsx`) | **Verificado en BD y Stripe:** Pago ID 3 (`pi_3UTnNoLtJcRjbnjR14NWkZJn`, GTQ 450.00), Carrito 4 (`pagado`), Reserva 4 (`confirmada`). Tarjeta Visa `4242` sin desafío 3DS (`three_d_secure: null`). |
| **B. Autenticación 3D Secure** | **Pendiente de desafío interactivo** | Sí (manejo de `requires_action` en `CheckoutPage.tsx`) | Pago 3 se procesó como tarjeta directa sin 3DS. Se preparó **Reserva 5** (ID 5, GTQ 450.00, 2026-11-23 a 2026-11-26) para validar el modal con tarjeta `4000 0027 6000 3184`. |
| **C. Tarjeta rechazada y recuperación** | **Parcialmente comprobado (Rechazo verificado en vivo; recuperación bloqueada por TTL de carrito)** | Sí (`pago.intentoActivo.test.ts` casos 3 y 4; `CheckoutPage.test.tsx`) | **Rechazo verificado:** Pago ID 4 (`pi_3UTnQqLtJcRjbnjR0dARZc3p`, GTQ 300.00), tarjeta `4002 0000 0000 0002` generó webhook `payment_intent.payment_failed` persistido en BD (`card_declined`). En Stripe el intent quedó en `requires_payment_method`. **Recuperación bloqueada:** Al expirar el Carrito 5 (TTL 15 min), el frontend bloquea `/checkout` con `<SinCarrito>`. |
| **D. Recarga o regreso al checkout con intento pendiente** | **Comprobado por contrato de API / Pendiente en navegador** | Sí (`pago.intentoActivo.test.ts` caso 1; `CheckoutPage.test.tsx`) | `GET /api/pagos/intento-activo?carrito_id=5` retorna el intento activo (`pi_3UTnQqLtJcRjbnjR0dARZc3p`, `puede_confirmar: true`) sin duplicar filas en `pagos`. |
| **E. Protección contra doble envío** | **Comprobado por prueba de concurrencia** | Sí (`pago.idempotency.concurrency.test.ts` y caso 8 de `pago.intentoActivo.test.ts`) | Bloqueo estricto por clave de idempotencia transaccional y validación de saldo expuesto (`committedOrProcessingExposure`). |

---

## Hallazgo y Bloqueo en la Recuperación tras Expiración de Carrito

1. **Condición observada:**
   - La prueba de rechazo con tarjeta `4002...` se realizó sobre el Carrito 5 a las `18:43 UTC`, generando el Pago 4 (`rechazado`) y dejando el PaymentIntent `pi_3UTnQqLtJcRjbnjR0dARZc3p` en Stripe en estado `requires_payment_method`.
   - A las `18:58 UTC` venció el TTL de 15 minutos del Carrito 5, pasando a estado `expirado`.
2. **Comportamiento en Backend vs Frontend:**
   - **Backend:** `GET /api/pagos/intento-activo?carrito_id=5` permite consultar y retornar el `client_secret` de `pi_3UTnQqLtJcRjbnjR0dARZc3p` con `puede_confirmar: true` aun con el carrito expirado.
   - **Frontend:** La pantalla `/checkout` consulta obligatoriamente `GET /api/carritos/actual`. Al estar el Carrito 5 expirado, la API responde 404 (`ACTIVE_CART_NOT_FOUND`) y el componente muestra `<SinCarrito>` en lugar del formulario de pago.
3. **Implicación:**
   - El usuario no puede recuperar el PaymentIntent existente desde la interfaz una vez que el carrito expira.
   - Si el usuario reincorpora la reserva a un nuevo carrito (Carrito 6), el flujo habitual de checkout crearía un nuevo PaymentIntent, dejando el anterior huérfano en Stripe con riesgo de cobro concurrente o incompatibilidad.

---

## Integración de Mejoras de QA y Consistencia de Pagos (`qa/backend-automation`)

En el commit `ee68e78` se integraron las mejoras de consistencia y concurrencia desarrolladas por José en `origin/qa/backend-automation`:
1. **Exposición financiera multi-habitación y carritos históricos (`reservationFinancialExposure`):**
   - Agrega la validación de pagos directos y pagos distribuidos desde carritos para reservas de habitación, evitando desbordamientos de saldo cuando una reserva transita por múltiples carritos o sufre pagos parciales/totales.
2. **Reconciliación de metadatos en Stripe tras commit (`reconcileIdempotentPaymentIntent`):**
   - Asegura que ante replays por clave de idempotencia, el `client_secret` y los metadatos en Stripe (`pago_id`) queden enlazados con la fila persistida durablemente tras el commit.
3. **Orden canónico de locks en webhooks de Stripe:**
   - Previene interbloqueos (deadlocks) en PostgreSQL al ordenar los locks transaccionales: Carrito -> Reservas en orden ascendente por ID -> Pagos.
4. **Protección de carritos en procesamiento:**
   - Bloquea mutaciones (añadir/quitar items) sobre carritos mientras existan pagos en estado `procesando`.
5. **Alineación con la reconciliación de intentos cancelados:**
   - Se preservó y combinó la reconciliación previa `reconcileCanceledStripePayments` con el nuevo `roomExposureBalance`.

---

## Procedimiento para Continuar las Pruebas

### Paso 1: Prueba de Autenticación 3D Secure (Reserva 5)
1. Abrir en el navegador: [http://localhost:5173/mis-reservas/5](http://localhost:5173/mis-reservas/5) (Reserva #5, fechas 2026-11-23 a 2026-11-26, GTQ 450.00).
2. Pulsar **"Añadir al carrito"** y navegar a `/checkout`.
3. Pulsar **"Preparar pago"**.
4. En el formulario de Stripe Elements, ingresar la tarjeta de prueba 3DS:
   - Número: `4000 0027 6000 3184`
   - Fecha y CVC: cualquier fecha futura y 3 dígitos.
5. Confirmar el pago y validar que se despliegue el modal interactivo de autenticación de Stripe ("Complete authentication").
6. Pulsar **"Complete"** en el modal de prueba y verificar la redirección a `/pagos/:id/resultado`.

### Paso 2: Prueba Limpia de Rechazo y Recuperación en una Sola Sesión
Para validar el criterio de recuperación dentro de la ventana de vigencia (15 min):
1. Usar el Carrito 6 ya existente con la Reserva 3 (GTQ 300.00), o preparar una reserva adicional si Carrito 6 llegara a vencer.
2. En `/checkout`, pulsar **"Preparar pago"**.
3. **Paso A (Rechazo):** Ingresar tarjeta `4002 0000 0000 0002` y pulsar pagar. Verificar el mensaje de rechazo en pantalla.
4. **Paso B (Recuperación inmediata sin recargar ni abandonar la sesión):** Sin salir de la pantalla, ingresar inmediatamente la tarjeta de éxito `4242 4242 4242 4242` y pulsar pagar.
5. Verificar que el mismo PaymentIntent es confirmado exitosamente y que la reserva transiciona a `confirmada`.
