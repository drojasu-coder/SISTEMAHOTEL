# 11. Plan incremental 3B–3E

## Fase 3B — Piloto aislado

- **Objetivo:** validar una frontera modular sin cambiar endpoints.
- **Alcance:** ownership de pagos o catálogo simple, uno solo.
- **Archivos:** módulo seleccionado, fachada pública, pruebas nuevas y montaje mínimo.
- **Precondición:** baseline verde y tests de contrato del módulo.
- **Riesgo:** cambios de import y conflictos con José.
- **Aceptación:** misma respuesta HTTP, misma autorización, tests previos y nuevos verdes.
- **Reversión:** revertir sólo commit de piloto; no usar reset ni tocar archivos locales ajenos.
- **Detener:** cualquier cambio de regla, contrato o migración.

## Fase 3C — Plataforma de módulos

- **Objetivo:** extraer convenciones repetidas de rutas, errores y validación.
- **Alcance:** sólo helpers demostrados por duplicación.
- **Riesgo:** alterar orden de middleware.
- **Aceptación:** snapshots/contratos HTTP idénticos.
- **Detener:** diferencia de status, body, headers o autenticación.

## Fase 3D — Segundo dominio no crítico

- **Objetivo:** aplicar la convención a catálogo/operaciones.
- **Alcance:** un dominio sin transacciones críticas.
- **Dependencias:** piloto 3B y plataforma 3C.
- **Aceptación:** pruebas unitarias, HTTP y typecheck; ningún modelo/migration movido.
- **Detener:** ciclo de imports o conflicto no resuelto con José.

## Fase 3E — Preparación de dominios críticos

- **Objetivo:** diseñar, no ejecutar todavía, fachadas para reservas/carritos/pagos.
- **Alcance:** contratos internos, pruebas de concurrencia y mapa transaccional.
- **Riesgo:** máximo.
- **Aceptación:** autorización explícita, pruebas concurrentes reproducibles y plan de rollback.
- **Detener:** falta de cobertura, cambio de contrato Stripe o pérdida de propagación de `transaction`.

