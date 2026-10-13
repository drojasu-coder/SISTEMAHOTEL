# OpenAPI, coverage y generados

## OpenAPI

`src/docs/swagger.ts` genera documentación en runtime y las pruebas verifican
93 paths/184 operaciones. `backend/openapi.json` es un archivo local no
versionado de 367.162 bytes; su relación exacta con el generador debe
confirmarse antes de ignorarlo, versionarlo o regenerarlo. Acción:
`REQUIERE_CONFIRMACION`.

## Coverage

`backend/coverage/` contiene el reporte generado por `npm run test:coverage`.
Su presencia actual es untracked y `.gitignore` no tiene una regla específica
para coverage; debe proponerse una regla en 5B. Acción: `GENERADO`, no borrar
en 5A.

## Otros

`node_modules/`, caches y posibles builds son outputs/instalaciones y deben
permanecer fuera del inventario individual masivo.
