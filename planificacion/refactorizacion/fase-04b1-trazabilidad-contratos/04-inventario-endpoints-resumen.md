# Resumen del inventario

## Conteos

| Método | Declaraciones en routers | Operaciones directas en `app.ts` | Total efectivo |
|---|---:|---:|---:|
| GET | 76 | 1 health | 77 |
| POST | 40 | 1 webhook | 41 |
| PUT | 0 | 0 | 0 |
| PATCH | 40 | 0 | 40 |
| DELETE | 26 | 0 | 26 |
| **Total** | **182** | **2** | **184** |

OpenAPI contiene 93 paths y 184 operaciones. La especificación local es un archivo protegido y no fue modificado. El Swagger generado en memoria es la fuente de las pruebas existentes; el CSV conserva la trazabilidad de código.

## Limitaciones

Los routers con llamadas multilinea impiden resolver todos los paths con un parser textual corto; esos registros conservan `UNKNOWN` y deben verificarse en revisión. El prefijo de `carritoItem` es anidado y se documenta con el mount observado. Las correspondencias de service/modelo requieren seguir imports y no se rellenaron con suposiciones.

No se detectaron duplicados de ID en el CSV. Las dos rutas modulares de `sucursales` y `configuraciones` son adapters: no se cuentan como operaciones adicionales porque reexportan routers legacy.
