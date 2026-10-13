# 04 — Tracked, untracked e ignored

| Elemento | Estado Git | Clasificación |
|---|---|---|
| `backend/` y su código versionado | `TRACKED_CLEAN` | `MANTENER_BACKEND` |
| documentos de `planificacion/` existentes | `TRACKED_CLEAN` | `MANTENER_DOCUMENTACION` |
| `script.sql` | `TRACKED_MODIFIED` | `PROTEGIDO_NO_TOCAR` |
| `docker-compose.yml`, `.gitignore` | `TRACKED_CLEAN` | `MANTENER_RAIZ` |
| `DERCAS.pdf`, `dercas.txt` | `UNTRACKED` | `PROTEGIDO_NO_TOCAR` |
| `TABLAS-Y-RELACIONES.md` | `UNTRACKED` | `PROTEGIDO_NO_TOCAR` |
| `Frontend/` | `UNTRACKED` | `PROTEGIDO_NO_TOCAR` |
| `backend/openapi.json` | `UNTRACKED` | `PROTEGIDO_NO_TOCAR` |
| `backend/scripts/` | `UNTRACKED` | `PROTEGIDO_NO_TOCAR` |
| ZIP de Fase 5F | `UNTRACKED` | `PROTEGIDO_NO_TOCAR` |
| `backend/.env`, `node_modules/` | `IGNORED` | `IGNORAR_GIT_RECOMENDADO` |

No se usaron comandos destructivos ni se recomendaron para untracked.
