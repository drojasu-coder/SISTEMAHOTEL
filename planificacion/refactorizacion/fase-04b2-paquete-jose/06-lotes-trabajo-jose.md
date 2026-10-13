# Lotes de trabajo para José

Los lotes no deben ejecutarse simultáneamente sobre archivos compartidos.

## J1 — Amenidades — primer lote recomendado

Confirmar las reglas del commit `83d0827` para reservas de amenidades, añadir pruebas aisladas y documentar la matriz de 36. Riesgo alto. Detenerse si la regla de estado o acceso es ambigua.

## J2 — Reserva de servicios de eventos

Comenzar únicamente después de que Diego revise y acepte J1. Trabajar los cinco endpoints resueltos de `reservaEventoServicio`, con foco en acceso propietario/ADMIN, estado de cotización, recálculo de subtotal/total/anticipo y transacciones. Requiere fixtures PostgreSQL. Detenerse ante cambios de modelo o contrato.

## J3 — Reservas auxiliares restantes

Separar actividades, mesas, parqueos, spa y transporte; un subdominio por commit. Cubrir estados, disponibilidad, cancelación/asignación donde el código ya lo defina. Dependencia: reglas confirmadas. Riesgo alto.

## J4 — Facturación y carritos

Validar IVA, totales, estados, expiración, items y relaciones. `/api/configuraciones/iva` es una dependencia que debe verificarse, pero no forma parte de los archivos que José puede modificar libremente. `backend/src/modules/configuraciones/` y sus fachadas/contrato continúan bajo coordinación con Diego; José no debe cambiar la regla ni el contrato de IVA para adaptar facturación sin autorización. No modificar pagos ni modelos sin coordinación. Requiere PostgreSQL aislado y casos negativos. Riesgo alto.

## J5 — Pagos y Stripe

Último lote: ownership, aprobación, reembolsos, idempotencia y webhook. Sólo fixtures/mocks; nunca claves o pagos reales. Requiere revisión conjunta y regresión completa. Riesgo crítico.

Cada lote debe informar SHA, archivos, endpoints, regla, pruebas, resultados, cobertura, riesgos y pendientes.
