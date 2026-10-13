# Archivos locales especiales

| Elemento | Versionado | Estado Git | Tipo | Consumidor | Acción |
|---|---|---|---|---|---|
| `script.sql` | no | modified localmente | SQL manual | usuario/manual | `REQUIERE_CONFIRMACION` |
| `DERCAS.pdf` | no | untracked | académico | entrega/referencia | `REQUIERE_CONFIRMACION` |
| `dercas.txt` | no | untracked | académico/fuente | entrega/referencia | `REQUIERE_CONFIRMACION` |
| `TABLAS-Y-RELACIONES.md` | no | untracked | académico | entrega/referencia | `REQUIERE_CONFIRMACION` |
| `Frontend/` | no | untracked | prototipo local | diseñador/usuario | `REQUIERE_CONFIRMACION` |
| `backend/openapi.json` | no | untracked | export/snapshot posible | usuario/frontend | `REQUIERE_CONFIRMACION` |
| `backend/scripts/` | no | untracked | scripts auxiliares | operador/manual | `REVISAR` |
| `backend/coverage/` | no | untracked | generado por Vitest | desarrollador | `GENERADO` |
| ZIPs | no se encontraron actualmente | no visible | temporal/paquete | usuario/manual | `REQUIERE_CONFIRMACION` |

No se inspeccionaron secretos ni se imprimieron valores de `.env`. Ningún
elemento fue borrado, movido o renombrado.

En Fase 5B se propondrá agregar `backend/coverage/` a `.gitignore`; no se
aplica ese cambio durante Fase 5A.
