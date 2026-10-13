# Trazabilidad profunda de dominios de José

## JOSE-01 — Las 36 operaciones

No existe en commits, documentos, comentarios, issues ni planificación una lista verificable de las 36 operaciones. Sólo existe el mensaje de `83d0827`: `fix: como 17 endpoints en total de 36 corregidos`. No se reconstruye arbitrariamente el conjunto. José debe entregar la matriz endpoint → regla → archivos → prueba.

## JOSE-02 — Reservas de amenidades

Ruta: `routes/amenidades/reservaAmenidad.routes.ts`; controller y service homónimos; validator `reservaAmenidad.validator.ts`; modelos de reserva/amenidad relacionados. El commit `83d0827` modificó route, service y validator. La suite actual no tiene prueba específica completa de este dominio. Riesgo alto por estado, acceso, disponibilidad y persistencia.

## JOSE-03 — Reservas auxiliares

| Subdominio | Rutas/services | Riesgo y brecha |
|---|---|---|
| Actividades | `reservaActividad.routes.ts`, controller/service/validator | estados y disponibilidad sin suite específica |
| Eventos | `reservaEvento.routes.ts` y `reservaEventoServicio.*` | montos, servicios, cotización y acceso; sin prueba específica completa |
| Mesas | `reservaMesa.*` | disponibilidad/estado; sin prueba específica |
| Parqueos | `reservaParqueo.*` | horario/solapamiento; sin prueba específica |
| Bienestar/Spa | `citaSpa.*` | estado y agenda; sin prueba específica |
| Transporte | `reservaTransporte.*` | asignación/cancelación/reintento; sin prueba específica |

## JOSE-04 — Pagos y reembolsos

`pago.routes.ts`, `pago.controller.ts`, `pago.service.ts`, `stripe.service.ts` y modelos de pagos/reembolsos. El service usa transacciones, locks, estados aprobados/reembolsados e idempotency keys; el webhook usa raw body y firma. Hay pruebas parciales de PostgreSQL, Stripe y webhook, pero no una matriz completa de idempotencia/reembolso. Riesgo crítico.

## JOSE-05 — Facturación

`factura.routes.ts`, controller/service/validator y `facturaItem.*`; IVA se obtiene desde configuración. El service recalcula subtotal, IVA y total y usa estado pendiente. No hay prueba PostgreSQL específica completa de facturas/items. Riesgo alto por importes y relaciones con pagos/carrito.

## JOSE-06 — Carritos

`carrito.routes.ts`, `carritoItem.routes.ts`, services homónimos y modelos de carrito/items. El código contiene estados activo/expirado, expiración, locks y transacciones. No hay suite HTTP completa de operaciones anidadas. Riesgo alto por importes, expiración y relación con pagos.
