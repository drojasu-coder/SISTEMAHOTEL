# OpenAPI y arquitectura

`openapi.test.ts` protege los endpoints de sucursales, configuración y el
inventario completo de 93 paths / 184 operaciones.

`architecture.test.ts` protege fachadas legacy, adapters de rutas e import
cycles. Estos tests justifican conservar capas detectadas en Fase 5C.

No se reemplazaron por snapshots ni se debilitaron asserts.
