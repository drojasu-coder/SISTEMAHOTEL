# Fase 5A — Inventario y clasificación

Fase exclusivamente documental. No se eliminaron, movieron, renombraron ni
modificaron archivos productivos, pruebas, modelos, migraciones, dependencias
ni artefactos protegidos.

## Baseline verificada

- Rama: `refactor/backend-architecture`
- HEAD: `c248d1c2a2f0dd884153602600a28ef1f66e8100`
- José: `origin/hardening/backend-final` en `83d0827`; continúa pausado y sin
  SHA definitivo.
- `npm test`: 65/65.
- `npm run typecheck`: correcto.
- Migraciones: 41 archivos.
- Operaciones HTTP históricas: 184.
- Paths OpenAPI históricos: 93.

## Conteo Git

| Estado | Conteo | Criterio |
|---|---:|---|
| TRACKED | 572 | `git ls-files` |
| UNTRACKED visible | 310 | `git ls-files --others --exclude-standard` |
| IGNORED | 10.582 | `git ls-files --others --ignored --exclude-standard` |

Los ignored están dominados por `backend/node_modules/`; `backend/coverage/`
es untracked visible y se agrupa como salida generada. Ambos se agrupan para
evitar miles de registros sin valor decisorio. El inventario maestro es
[03-inventario-maestro.csv](./03-inventario-maestro.csv).
