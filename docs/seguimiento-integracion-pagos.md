# Seguimiento de Integración de Pagos (BE-014)

Este documento registra el progreso, la arquitectura técnica, las decisiones de diseño y las verificaciones manuales y automatizadas correspondientes al lote de pagos con Stripe Checkout y Payment Element (**BE-014**).

---

## Distinción de comprobaciones y estado de los escenarios

| Escenario | Comprobación en navegador real con Stripe de prueba | Cobertura automatizada | Evidencia consultada y estado técnico |
|---|---|---|---|
| **A. Pago exitoso directo** | **Comprobado en vivo** | Sí (`pago.intentoActivo.test.ts`, `CheckoutPage.test.tsx`) | **Verificado en BD y Stripe:** Pago ID 3 (`pi_3UTnNoLtJcRjbnjR14NWkZJn`, GTQ 450.00), Carrito 4 (`pagado`), Reserva 4 (`confirmada`). Tarjeta Visa `4242` sin desafío 3DS (`three_d_secure: null`). |
| **B. Autenticación 3D Secure** | **Comprobado en vivo en navegador** | Sí (manejo de `requires_action` en `CheckoutPage.tsx`) | **Verificado en BD y Stripe:** Reserva 5, Carrito 10, Pago 8 por GTQ 450.00 (`pi_3UTzujLtJcRjbnjR15GIBrMT`). Desafío modal interactivo completado (`authentication_flow: challenge`, `result: authenticated`), webhooks `payment_intent.requires_action` -> `payment_intent.succeeded` -> `charge.succeeded` recibidos con HTTP 200. Pago 8 `aprobado`, Carrito 10 `pagado`, Reserva 5 `confirmada`. |
| **C. Tarjeta rechazada y recuperación** | **Comprobado en vivo en navegador** | Sí (`pago.intentoActivo.test.ts` casos 3 y 4; `CheckoutPage.test.tsx`) | **Verificado en BD y Stripe:** Reserva 3, Carrito 9, Pago 7 por GTQ 300.00 (`pi_3UTzjZLtJcRjbnjR1LINBYWW`). Rechazo inicial con tarjeta `4002 0000 0000 0002` persistido como `rechazado` en BD (`codigo_error_externo: 'card_declined'`). Recuperación inmediata con tarjeta `4242 4242 4242 4242` sobre el mismo intento en la misma sesión; webhook recibido con HTTP 200: Pago 7 `aprobado`, Carrito 9 `pagado`, Reserva 3 `confirmada`. |
| **D. Recarga o regreso al checkout con intento pendiente** | **Comprobado por contrato de API / Cobertura automatizada en cliente** | Sí (`pago.intentoActivo.test.ts` caso 1; `CheckoutPage.test.tsx` 17 tests pasando) | `GET /api/pagos/intento-activo` y la lógica de cliente recuperan el intento activo sin duplicar filas en `pagos`. (No ejecutado como recarga manual en navegador). |
| **E. Protección contra doble envío** | **Comprobado por prueba de concurrencia** | Sí (`pago.idempotency.concurrency.test.ts`, `pago.reconcileMetadata.test.ts`) | Bloqueo estricto por clave de idempotencia transaccional, orden determinista de locks (`order: [["id", "ASC"]]`) y validación de saldo expuesto (`committedOrProcessingExposure`). |

---

## Resolución de Intentos Huérfanos tras Expiración de Carritos

1. **Condición original observada:**
   - La prueba de rechazo con tarjeta `4002...` sobre Carrito 5 generó Pago 4 (`rechazado`) y dejó el PaymentIntent `pi_3UTnQqLtJcRjbnjR0dARZc3p` en Stripe en estado `requires_payment_method`. Al expirar el Carrito 5 (TTL 15 min), el intento quedó huérfano.
2. **Solución implementada (`84f9232` y `899a98b`):**
   - Se incorporó la reconciliación y cancelación automática de intentos pendientes entre carritos (`reconcileCanceledStripePayments` y cancelación dangling cross-cart protegida contra estados `processing` y fallos de API).
   - Al generarse el nuevo intento para Carrito 9, el intento anterior `pi_3UTnQqLtJcRjbnjR0dARZc3p` fue cancelado formalmente en Stripe y en BD (`estado = 'cancelado'`), eliminando riesgos de cobro duplicado o incompatibilidad financiera.
3. **Auditoría de cobros:**
   - Cero cobros duplicados en las compras y transacciones registradas.

---

## Integración y Consistencia de Base de Datos

- **Migración de integridad:** `20261022000000-enforce-reserva-habitacion-integrity.js` fue aplicada con éxito en `hotel_test_db:55432` mediante `npx sequelize-cli db:migrate --name ... --env test`.
  - Se verificaron en `pg_constraint` las 4 restricciones aplicadas (`check_reserva_fechas_coherentes`, `check_reserva_fechas_no_pasadas`, `check_reserva_huespedes_valido`, `check_reserva_total_no_negativo`).
  - Todas las reservas existentes cumplieron las restricciones.
  - Se generó respaldo previo persistente verificado en `/home/diegorojas/.backups/hotel_test_db/hotel_test_db_pre_migration_20261024_0145.dump` (código de salida 0 en `pg_dump` y `pg_restore --list`).
- **Base de datos principal:** `hotel_db` (puerto 5432) se mantuvo 100% intacta sin modificaciones ni ejecuciones de migración.

---

## Conclusión

El módulo de pagos (**BE-014**) satisface la totalidad de criterios funcionales, de consistencia transaccional, contratos OpenAPI, tipado y validación en vivo con Stripe testmode. Queda formalmente cerrado y resuelto.
