# Plan para Fase 5C

Fase 5C debe concentrarse exclusivamente en:

- código muerto;
- fachadas legacy;
- controllers/services legacy;
- route adapters;
- exports no consumidos;
- imports;
- compatibilidad temporal.

Debe combinar imports, entrypoints, Sequelize discovery, Swagger, tests y
compatibilidad pública. No debe incluir todavía hardcoding, estados,
dependencias ni limpieza de tests; corresponden a Fases 5D–5F.

Cada eliminación requerirá evidencia de ausencia de consumidores, pruebas
de regresión y estrategia de rollback. José continúa pausado y no se le
asigna SHA.
