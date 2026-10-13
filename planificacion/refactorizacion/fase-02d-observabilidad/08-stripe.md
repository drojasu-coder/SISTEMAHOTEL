# Stripe y pagos

El webhook conserva `express.raw`, verificación de `Stripe-Signature`, ausencia de JWT e idempotencia existente. Tras verificar la firma se registra únicamente request ID, `eventId` y `eventType`; después se registra el resultado procesado.

No se registran firmas, secretos, payloads, tarjetas ni datos de pago. No se ejecutaron cobros reales.

