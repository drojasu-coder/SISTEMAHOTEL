# 11 — `backend/scripts/`

`backend/scripts/export-openapi.ts` importa `swaggerSpec`, serializa el
documento y escribe `openapi.json`. Es una herramienta útil para compartir el
contrato con el futuro frontend.

Clasificación: `PROTEGIDO_NO_TOCAR` / `REQUIERE_CONFIRMACION` por estar
untracked. Debe permanecer bajo `backend/scripts/` si posteriormente se
versiona; no se debe mover ni versionar automáticamente.
