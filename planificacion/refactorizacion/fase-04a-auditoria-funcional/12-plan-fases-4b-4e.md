# Plan de Fases 4B–4E

## 4B — Correcciones pendientes y reglas por responsable

Objetivo: obtener la matriz de José, confirmar reglas y cubrir brechas de menor acoplamiento. Dependencias: autorización, baseline y PostgreSQL test. Entregables: correcciones funcionales aisladas, pruebas y contratos. Riesgo: cambiar comportamiento ambiguo. Aceptación: cada cambio tiene regla aprobada y regresión. Bloqueo: falta de definición del requisito.

## 4C — Reservas, disponibilidad y concurrencia

Objetivo: validar habitaciones y reservas auxiliares, estados, cancelaciones, solapamientos y transacciones. Dependencias: 4B y fixtures. Entregables: matriz de estados y pruebas concurrentes por dominio. Riesgo: pérdida o doble asignación. Aceptación: invariantes PostgreSQL reproducibles. Bloqueo: modelos/migraciones no acordados.

## 4D — Pagos, carritos y facturación

Objetivo: validar importes, IVA, ownership, idempotencia, reembolsos y Stripe. Dependencias: contratos de reserva y fixtures sin secretos. Entregables: pruebas con mocks, estados y webhook raw. Riesgo: cobros inconsistentes. Aceptación: ningún pago real, contratos preservados. Bloqueo: cambios Stripe o datos no aislados.

## 4E — Regresión y aceptación

Objetivo: ejecutar suite completa, comparar OpenAPI y aceptar por dominio. Dependencias: 4B–4D. Entregables: reporte final, riesgos y decisión de integración. Riesgo: regresiones cruzadas. Aceptación: pruebas, typecheck, contratos y revisión conjunta. Bloqueo: fallos no explicados.

Ninguna subfase se ejecuta automáticamente en 4A.
