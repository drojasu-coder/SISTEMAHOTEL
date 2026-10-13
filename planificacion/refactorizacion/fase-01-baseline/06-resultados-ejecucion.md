# 06 — Resultados de ejecución

Fecha de ejecución: 2026-10-13.

| Comando | Resultado |
|---|---|
| `cd backend && npm test` | 5 archivos, **16 pruebas exitosas** |
| `cd backend && npm run test:unit` | 4 archivos, **12 pruebas exitosas** |
| `cd backend && npm run test:integration` | 1 archivo, **4 pruebas exitosas** |
| `cd backend && npm run test:coverage` | 5 archivos, **16 pruebas exitosas**; cobertura global V8: 34.95% statements, 2.95% branches |
| `cd backend && npm run typecheck` | Exitoso (`tsc --noEmit`) |

## Cobertura interpretada

La cobertura es una línea base, no un umbral de aceptación. La importación de `app` carga todos los módulos, pero solo se ejercitan health, validación, auth sin token, ownership y utilidades Stripe. Servicios de negocio y persistencia permanecen mayoritariamente sin cubrir.

## Advertencias

Vitest mostró una advertencia de futura compatibilidad sobre la carga ESM de `vitest.config.ts` dentro de un paquete CommonJS; no hizo fallar la ejecución. No se hizo una migración de módulo porque sería ajena al objetivo de esta fase.

## Bloqueos

No se ejecutaron migraciones ni pruebas de integración PostgreSQL. Docker está disponible y el compose aislado fue creado, pero iniciar infraestructura y cargar fixtures requiere una ejecución posterior explícitamente controlada.
