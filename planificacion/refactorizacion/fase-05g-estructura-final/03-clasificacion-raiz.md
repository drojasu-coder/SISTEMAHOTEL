# 03 — Clasificación de la raíz

| Elemento | Clasificación | Ubicación propuesta | Riesgo / aplicación |
|---|---|---|---|
| `backend/` | `MANTENER_BACKEND` | `/backend` | Bajo; mantener |
| `Frontend/` | `PROTEGIDO_NO_TOCAR` | `/Frontend` | Alto; revisión humana |
| `planificacion/` | `MANTENER_DOCUMENTACION` | `/planificacion` | Bajo; no migrar masivamente |
| `docker-compose.yml` | `MANTENER_RAIZ` | `/docker-compose.yml` | Bajo; orquesta repo |
| `.gitignore` | `MANTENER_RAIZ` | `/.gitignore` | Bajo; no requiere cambio |
| `script.sql` | `PROTEGIDO_NO_TOCAR` | `/script.sql` | Tiene cambios locales |
| DERCAS | `PROTEGIDO_NO_TOCAR` | raíz hasta aprobación | Académico |
| `TABLAS-Y-RELACIONES.md` | `PROTEGIDO_NO_TOCAR` | raíz hasta aprobación | Documentación DB |
| ZIPs | `PROTEGIDO_NO_TOCAR` | local hasta aprobación | Transferencia |

No se aplicó ninguna clasificación que implique mover o borrar.
