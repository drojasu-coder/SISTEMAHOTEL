# Resumen del inventario

## Magnitud

- 572 elementos versionados.
- 310 elementos untracked visibles, dominados por documentación/locales,
  `Frontend/`, `backend/openapi.json`, scripts y el output generado
  `backend/coverage/`.
- 10.582 elementos ignored, dominados principalmente por `node_modules/` y
  otros patrones existentes de `.gitignore`.
- 266 archivos bajo `backend/src`.
- 16 archivos bajo `backend/tests`.
- 41 migraciones y 39 modelos.
- 268 archivos bajo `planificacion/refactorizacion`.

## Decisiones preliminares

- Código productivo, modelos, migraciones y tests: `MANTENER` en 5A.
- Fachadas, adapters y hardcoding: `REVISAR`/`CONSOLIDAR` en fases asignadas.
- Académicos, SQL manual, frontend local y archivos de compañeros:
  `REQUIERE_CONFIRMACION`.
- `node_modules/`: `IGNORAR_GIT`; `backend/coverage/`: `GENERADO` y
  actualmente untracked visible. En Fase 5B se propondrá agregar coverage a
  `.gitignore`.
- Documentación histórica: conservar evidencia; evaluar `ARCHIVAR` o mover en
  5B, sin hacerlo ahora.

No se declara ningún archivo definitivamente eliminable.
