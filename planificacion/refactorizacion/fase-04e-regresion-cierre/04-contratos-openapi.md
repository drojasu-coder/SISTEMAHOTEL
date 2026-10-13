# Contratos HTTP y OpenAPI

La evidencia de Fases 4A/4B-1 registra 184 operaciones efectivas:
182 declaraciones de routers, `GET /api/health` y el webhook Stripe montado
directamente en `app.ts`. OpenAPI registra 93 paths y 184 operaciones.

La prueba `tests/unit/openapi.test.ts` pasó dentro de las 37 unitarias y
protege el conteo generado en memoria. No se modificó
`backend/openapi.json`.

Conclusiones:

- los conteos históricos siguen siendo la referencia verificable disponible;
- declaración estática, montaje Express y documentación OpenAPI no son
  conceptos equivalentes;
- la matriz de Fase 4B-1 muestra cobertura específica incompleta;
- no se normalizaron status, `data`, errores ni códigos HTTP;
- no se detectó una ruptura contractual durante la regresión.

La consolidación no convierte un conteo OpenAPI en evidencia de funcionamiento
de cada endpoint.
