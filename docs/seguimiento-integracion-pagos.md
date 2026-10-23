# Seguimiento de Integración de Pagos (BE-014)

## Estado actual
- **Estado de BE-014:** Integración / Verificación pendiente.
- **Razón:** La comprobación interactiva de extremo a extremo con Stripe Elements y autenticación 3DS en navegador real requiere configuración pendiente (`VITE_STRIPE_PUBLISHABLE_KEY` en `Frontend/.env` y navegador con entorno gráfico interactivo).
- **Aclaración sobre Webhooks:** La presencia de `STRIPE_WEBHOOK_SECRET` en `backend/.env` valida que el secreto de firma está configurado, pero **no garantiza** que el webhook local esté recibiéndose correctamente en tiempo de ejecución (requiere reenvío activo mediante `stripe listen --forward-to localhost:3000/api/pagos/stripe/webhook` durante el cobro).

## Configuración local verificada (sin secretos)
- **Backend (`backend/.env`):**
  - `STRIPE_SECRET_KEY`: Configurada en modo de prueba (`sk_test_...`).
  - `STRIPE_WEBHOOK_SECRET`: Configurada (`whsec_...`).
  - Base de datos de pruebas: `hotel_test_db` en puerto 55432 (disponible y verificada).
- **Frontend (`Frontend/.env`):**
  - `VITE_STRIPE_PUBLISHABLE_KEY`: Ausente / no configurada. Bloquea la carga real de Stripe Elements en el navegador.
- **Herramientas de entorno:**
  - Stripe CLI disponible en `/usr/local/bin/stripe`.
  - Sin navegador gráfico interactivo en la sesión para completar desafíos 3DS interactivos.

## Cobertura automatizada implementada y ejecutada
Ejecutada mediante el runner configurado en backend (**Vitest**, `npm --prefix backend test tests/pagos/pago.intentoActivo.test.ts`):
1. **Rechazo y recuperación:** Recuperación de PaymentIntent en `requires_payment_method` tras rechazo de tarjeta (`pago.intentoActivo.test.ts` casos 3 y 4; `CheckoutPage.test.tsx`).
2. **Protección contra cobros incompatibles:** Si Stripe confirma éxito mientras el webhook local sigue en proceso o rechazado, `committedOrProcessingExposure` bloquea un cobro concurrente excedente con error 409 `PAYMENT_EXCEEDS_BALANCE` (`pago.intentoActivo.test.ts` casos 8, 9, 10; `CheckoutPage.test.tsx`).
3. **Cancelación externa:** Reconciliación segura de cancelaciones liberando reservas o carritos solo si no hay aprobación concurrente (`pago.intentoActivo.test.ts` casos 7 y 10; `PagoResultadoPage.test.tsx` casos 3 y 4).
4. **Pago local sin identificador externo:** Distinción y recuperación sin fallar (`pago.intentoActivo.test.ts` caso 5; `CheckoutPage.test.tsx`).
5. **Cambio de importe con intento pendiente:** Verificación estricta contra saldo de servidor que impide confirmar un intento obsoleto o crear otro cobro mientras esté activo (`CheckoutPage.test.tsx`).
6. **Aislamiento por usuario e idempotencia:** Identificación con `userId` en claves de consulta y persistencia de clave de idempotencia (`PagoResultadoPage.test.tsx` casos 1, 2, 5, 6; `pago.idempotency.concurrency.test.ts`).
7. **Fin del polling sin falso positivo:** Manejo de estado procesando y límite de sondeo sin asumir estados no comprobados (`PagoResultadoPage.test.tsx` caso 8).

## Verificaciones no ejecutadas y motivo
- **Comprobación manual de compra en navegador real:** Requiere `VITE_STRIPE_PUBLISHABLE_KEY` en `Frontend/.env` y navegador interactivo para rellenar el iframe de Stripe Elements.
