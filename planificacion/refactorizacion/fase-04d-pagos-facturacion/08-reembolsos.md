# Reembolsos

`createReembolso` requiere pago existente, ownership administrativo según `paymentOwnership`, estado aprobado/reembolsado y monto positivo dentro del saldo restante. Usa transacción y lock del pago.

Para tarjeta llama `stripeService.createRefund` con PaymentIntent, monto GTQ y la clave de idempotencia; crea localmente estado `aprobado`, `pendiente` o `rechazado` según la respuesta. Para métodos no Stripe crea reembolso local aprobado.

El webhook de refund busca por `id_reembolso_externo`, crea o actualiza el registro y recalcula el estado agregado del pago.

Riesgos: no se actualiza factura al reembolsar; repetición concurrente depende del lock y de la clave externa; una respuesta externa seguida de fallo local puede dejar sincronización pendiente; el índice único de migración debe verificarse en cada ambiente.

Reglas de importes, reembolso parcial/múltiple y permisos de operación administrativa son verificables parcialmente; cualquier cambio de negocio es `REQUIERE_CONFIRMACION_NEGOCIO`.
