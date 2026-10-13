# 1. Selección del módulo

Se compararon tres candidatos:

| Candidato | Endpoints | Complejidad | Riesgo |
|---|---|---|---|
| Sucursales | GET lista, GET detalle, POST, PATCH, DELETE | Sin transacciones ni integraciones; DELETE sólo cuenta habitaciones | Bajo/medio |
| Salones | CRUD, validación de sucursal, relación con reservas de eventos | Depende de Sucursal y ReservaEvento | Medio |
| Configuración IVA | GET y PATCH | `GET` puede crear configuración implícitamente; afecta cálculos | Medio |

Se seleccionó **sucursales** porque tiene límites funcionales claros, no participa directamente en pagos/reservas transaccionales, no tiene cambios en los paths equivalentes de la referencia local de José y permite validar route/controller/service/validator sin mover modelos.

Archivos originales: `src/routes/sucursales/sucursal.routes.ts`, `src/controllers/sucursales/sucursal.controller.ts`, `src/services/sucursales/sucursal.service.ts`, `src/validators/sucursales/sucursal.validator.ts`.

