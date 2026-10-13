# Arquitectura consolidada

La arquitectura continúa siendo un monolito modular parcialmente aplicado:

- `sucursales` y `configuraciones` son módulos piloto;
- existen fachadas legacy y adapters de rutas;
- Swagger depende de la composición de `src/routes`;
- el manejo de errores y la validación están centralizados;
- las pruebas arquitectónicas pasaron;
- no se retiraron fachadas ni adapters.

Clasificación para limpieza:

| Elemento | Estado |
|---|---|
| Módulos piloto | MANTENER |
| Fachadas legacy | REVISAR |
| Adapters de rutas | REVISAR |
| Composición Swagger | MANTENER hasta migración controlada |
| Posibles ciclos | REVISAR con evidencia, no eliminar por suposición |

La compatibilidad legacy sigue siendo necesaria mientras las rutas antiguas y
los módulos nuevos coexistan.
