# 08 — Preparación para Fase 2

## Evaluación

**No se recomienda iniciar todavía la refactorización estructural completa.** Existe una línea base suficiente para cambios internos pequeños y revisables en utilidades puras, pero no para modificar infraestructura de producción, persistencia, middleware global o pagos.

## Requisitos antes de Fase 2

1. Levantar y verificar `hotel_test_db` mediante el compose aislado.
2. Ejecutar migraciones solo contra `127.0.0.1:55432/hotel_test_db`.
3. Crear fixtures explícitos y repetibles de roles, usuarios, recursos, reservas y pagos ficticios.
4. Completar pruebas de contratos de reservas, ownership, roles, transacciones y webhook firmado.
5. Resolver la advertencia de configuración Vitest o documentar una decisión compatible.
6. Registrar una decisión sobre compatibilidad de envelopes antes de normalizar respuestas.

## Criterio para autorizar una primera extracción

Puede autorizarse una extracción de helper puro cuando:

- no cambia imports ni contratos públicos;
- tiene pruebas unitarias;
- las pruebas HTTP baseline siguen pasando;
- `npm run typecheck` sigue pasando;
- no toca migraciones ni datos;
- se revisa en una rama/commit separado.

La Fase 2 no debe comenzar automáticamente.
