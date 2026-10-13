# Código muerto y compatibilidad legacy

## Clasificación inicial

| Área | Estado | Evidencia |
|---|---|---|
| `src/modules/sucursales` | `ACTIVO` | pruebas arquitectónicas y rutas |
| `src/modules/configuraciones` | `ACTIVO` | IVA, rutas y pruebas |
| controladores legacy de sucursales/configuración | `LEGACY_NECESARIO` | tests verifican fachadas apuntando al módulo |
| adapters de rutas | `COMPATIBILIDAD_TEMPORAL` | composición actual y Swagger |
| servicios sin import directo | `REQUIERE_ANALISIS` | pueden tener discovery, tests o API pública |
| rutas no montadas aparentes | `REQUIERE_ANALISIS` | verificar composición antes de concluir |
| validators/helpers | `REQUIERE_ANALISIS` | `rg` aislado no prueba ausencia de consumo |

No se declaró código muerto definitivo. Fase 5C debe combinar imports,
entrypoints, Sequelize, Swagger, tests y compatibilidad pública.
