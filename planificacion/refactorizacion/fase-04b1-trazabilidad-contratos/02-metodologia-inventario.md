# Metodología del inventario

El inventario se derivó con un script temporal no versionado que:

1. Recorrió `backend/src/routes/**/*.ts`.
2. Detectó declaraciones `router.get/post/put/patch/delete`.
3. Resolvio el prefijo montado según `backend/src/app.ts` y el nombre del router.
4. Registró archivo, línea, método, URL, middleware visible, rol, validators visibles y handler cuando el bloque lo permitió.
5. Añadió las dos operaciones montadas directamente por `app.ts`: health y webhook Stripe.
6. Generó `03-inventario-endpoints.csv` y, a partir de éste, `05-matriz-cobertura.csv`.

Las columnas `service`, `models` y algunas asociaciones handler/validator se marcan como `requires trace` cuando no pueden resolverse de forma segura con un parser textual. Esto evita convertir una inferencia en evidencia. Las declaraciones que no permitieron extraer el path se marcan `UNKNOWN`; las limitaciones quedan registradas en el resumen.

Conteos independientes:

- 38 routers.
- 182 declaraciones de router: GET 76, POST 40, PATCH 40 y DELETE 26.
- 184 operaciones efectivamente montadas contando health y webhook.
- 93 paths y 184 operaciones en el `backend/openapi.json` existente, consultado sin modificarlo.

La equivalencia 184/184 no demuestra por sí sola que cada contrato sea correcto; sólo confirma igualdad de conteo. Se requieren comparación semántica y pruebas por operación.
