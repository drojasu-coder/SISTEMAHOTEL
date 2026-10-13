# `backend/openapi.json`

## Evidencia

- Está untracked y no fue modificado.
- Runtime importa `swaggerSpec` desde `src/docs/swagger.ts`.
- Las pruebas importan el mismo `swaggerSpec` en memoria.
- `backend/scripts/export-openapi.ts` serializa ese spec hacia
  `openapi.json` cuando se ejecuta manualmente.
- No aparece como consumidor de runtime ni como entrada de tests.

## Decisión

`backend/openapi.json` queda como `GENERAR_BAJO_DEMANDA` y
`REQUIERE_CONFIRMACION` antes de versionarlo, ignorarlo o eliminarlo.
Puede ser útil como snapshot para frontend, pero no es la fuente canónica
actual. Su contenido no fue modificado.
