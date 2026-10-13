# Sucursales

Estado: `ACTIVO` / `COMPATIBILIDAD_NECESARIA`.

`src/app.ts` monta `modules/sucursales/sucursal.routes`. Ese adapter conserva
la identidad del router documentado en `routes/sucursales/sucursal.routes`.
El controller modular consume el service modular; las fachadas legacy son
importadas por la prueba arquitectónica y preservan la API interna anterior.

Decisión: conservar módulo, adapter, controller, service y validators.
