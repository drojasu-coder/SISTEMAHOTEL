# 8. Transacciones críticas

## Pagos

`pago.service.ts` usa transacciones en creación, procesamiento de webhook, aprobación de transferencia y reembolso. Hay locks `UPDATE`, comprobaciones de idempotencia por identificador externo y cambios coordinados de pagos, carritos y reservas. Stripe se verifica con cuerpo raw antes de procesar.

## Reservas

`reservaHabitacion.service.ts` crea reservas dentro de transacción y consulta disponibilidad/solapamiento con lock cuando corresponde. Transporte, eventos, amenidades, turnos y carritos también contienen transacciones y locks en funciones concretas. Las líneas de evidencia se localizaron mediante `sequelize.transaction`, `transaction` y `transaction.LOCK.UPDATE`.

## Invariantes que no se pueden romper

1. Una reserva confirmada no puede aparecer dos veces por concurrencia.
2. Un pago no puede superar el importe permitido ni procesarse dos veces.
3. El webhook debe aceptar sólo firmas válidas y mantener idempotencia.
4. Toda lectura/escritura que participa en una operación transaccional debe recibir el mismo `transaction`.
5. Los errores deben provocar rollback y conservar los códigos HTTP actuales.

La refactorización debe mover primero fachadas, no extraer consultas o callbacks sin pruebas de concurrencia. No se identificó un isolation level explícito distinto del default; debe verificarse en una fase de implementación antes de documentarlo como garantía.

