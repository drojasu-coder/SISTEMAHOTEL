# Baseline Git y pruebas

| Comprobación | Resultado |
|---|---|
| Rama | `refactor/backend-architecture` |
| HEAD | `c248d1c2a2f0dd884153602600a28ef1f66e8100` |
| Referencia José | `origin/hardening/backend-final` → `83d0827` |
| Merge-base | `83d0827` |
| HEAD por delante de José | `c248d1c` y la línea de fases posteriores |
| José por delante | ninguno en referencia local |
| `npm test` | 14 archivos, 65 pruebas exitosas |
| `npm run typecheck` | exitoso |
| Migraciones | 41 en `backend/src/migrations` |

Estado local previo a Fase 5A: `script.sql` modificado; `DERCAS.pdf`,
`dercas.txt`, `TABLAS-Y-RELACIONES.md`, `Frontend/`, `backend/openapi.json`,
`backend/scripts/` y `backend/coverage/` sin tracking. No se alteraron.
