# Candidatos analizados

| Grupo | Resultado | Evidencia |
|---|---|---|
| Controllers y services legacy | `LEGACY_NECESARIO` | `tests/unit/architecture.test.ts` importa y compara identidades |
| Adapters de sucursales/configuración | `COMPATIBILIDAD_NECESARIA` | montaje modular y tests de igualdad de routers |
| Validators | `ACTIVO` | imports desde routers |
| Helpers de IVA | `ACTIVO` | `factura.service.ts` consume `getIvaValue` |
| Rutas | `ACTIVO` | montaje en `app.ts` y documentación Swagger |
| TODO/FIXME/deprecated | `REQUIERE_CONFIRMACION` | no implican por sí solos código muerto |

No hubo candidato con evidencia suficiente para eliminación.
