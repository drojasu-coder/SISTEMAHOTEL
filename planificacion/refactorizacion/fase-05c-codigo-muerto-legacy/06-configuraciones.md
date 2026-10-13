# Configuraciones

Estado: `ACTIVO` / `COMPATIBILIDAD_NECESARIA`.

`src/app.ts` monta el adapter modular bajo `/api/configuraciones`. El router
legacy contiene la documentación Swagger y consume controller y validator
modulares. `getIvaValue` no está muerto: lo consume
`services/habitaciones/factura.service.ts`.

Decisión: conservar reglas de IVA, rutas, validator, controller/service
modulares y fachadas legacy. No se modificó el contrato `/api/configuraciones/iva`.
