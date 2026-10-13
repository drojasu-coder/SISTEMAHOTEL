# Bloqueos y decisiones

## Defectos confirmados

No se reprodujo un defecto crítico nuevo durante esta regresión. Los riesgos
de inspección no se elevaron artificialmente a defectos.

## Decisiones pendientes

- si se requiere deduplicación por `Stripe event.id`;
- relación formal entre factura, pago y carrito;
- atomicidad requerida para factura-items;
- estrategia para Stripe externo frente a commit PostgreSQL;
- ownership definitivo de facturación;
- estados e idempotencia;
- reglas de reembolso;
- tratamiento de reservas auxiliares concurrentes.

La validación de migraciones ya no es un bloqueo: las 41 migraciones están
`up`, hay 0 `down` y no se reportó error ni drift.

Fase 4E puede recomendar `NO_GO_FASE_5` si aparece un defecto crítico
reproducible. No debe inventar una regla de negocio para cerrar una brecha.
