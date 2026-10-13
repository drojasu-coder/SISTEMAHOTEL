# Metodología

## Fuentes

1. Git (`ls-files`, estados y reglas de ignore).
2. Estructura real de `backend/src`, `backend/tests`,
   `planificacion/refactorizacion` y archivos locales.
3. Consumidores encontrados por imports, composición de `app.ts`, rutas,
   Swagger, scripts y pruebas.
4. Evidencia histórica de Fases 4A–4E.

## Reglas

- Agrupar sólo masas sin valor individual: `node_modules/`, `coverage/` y
  salidas similares.
- Un archivo sin import directo no se declara muerto automáticamente.
- `REQUIERE_CONFIRMACION` para académicos, SQL manual, frontend local,
  scripts y archivos de compañeros.
- `PROBABLE_ELIMINAR` es candidato, nunca autorización de borrado.
- No se ejecutaron scripts desconocidos ni herramientas destructivas.

El CSV maestro conserva evidencia, consumidor, estado Git, acción propuesta y
fase destino para cada registro detallado o grupo explícitamente identificado.
