# Fase 1C — Resultados

Resultados exactos de la matriz:

| Comando | Resultado |
|---|---|
| `npm test` | 7 archivos pasaron, 1 falló; 27 pasaron, 1 falló |
| `npm run test:unit` | 4 archivos, 14/14 exitosas |
| `npm run test:integration` | 3 archivos pasaron, reservas 1 falló; 13 pasaron, 1 falló |
| `npm run test:coverage` | falló por la misma prueba de concurrencia |
| `npm run typecheck` | exitoso |

La ejecución específica de concurrencia produjo 4/5 pruebas exitosas y 1 fallo
reproducible por condición de carrera. Auth y pagos conservaron sus pruebas exitosas
en dos ejecuciones consecutivas; auth añadió token inválido y expirado.

La suite completa y los comandos obligatorios deben ejecutarse nuevamente; mientras el
defecto de concurrencia siga sin corregirse, una ejecución que incluya la prueba
protectora debe conservar estado fallido y no presentarse como verde.
