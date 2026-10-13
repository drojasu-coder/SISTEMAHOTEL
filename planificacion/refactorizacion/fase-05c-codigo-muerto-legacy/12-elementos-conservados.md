# Elementos conservados

Se conservaron los módulos piloto de sucursales y configuraciones, sus
validators, routers, controllers y services; las fachadas legacy; los
adapters bajo `src/routes`; y `getIvaValue`.

Motivos: montaje Express, descubrimiento Swagger, consumidores productivos,
compatibilidad interna y pruebas arquitectónicas.
