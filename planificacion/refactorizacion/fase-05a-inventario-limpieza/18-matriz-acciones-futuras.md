# Matriz de acciones futuras

| Subfase | Trabajo | Candidatos | Criterio |
|---|---|---|---|
| 5B | archivos, artefactos, docs, ignore | académicos, OpenAPI, coverage, historial | confirmar fuente/entrega antes de mover |
| 5C | código muerto/legacy | fachadas, adapters, imports | demostrar ausencia de consumidores |
| 5D | hardcoding/config | IVA, estados, URLs, límites | distinguir env, constante y regla |
| 5E | tests/helpers | tests útiles o repetidos | equivalencia y regresión |
| 5F | dependencias/imports | package y lock | uso real y tooling |
| 5G | estructura final | docs/directorios | propuesta aprobada |
| 5H | regresión | backend completo | suite y contratos sin regresiones |

Cada acción requiere evidencia, responsable y rollback. Ninguna acción se
ejecuta en 5A.
