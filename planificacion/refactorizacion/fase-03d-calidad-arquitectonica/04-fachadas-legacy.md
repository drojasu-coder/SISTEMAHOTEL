# Calidad de fachadas legacy

Las fachadas de controller y service sólo reexportan símbolos del módulo. No tienen consumidores internos detectados, pero se mantienen como puntos de compatibilidad para importadores externos y pruebas existentes; eliminarlas sería un cambio público no demostrado como seguro.

Los adapters de rutas son necesarios: `app.ts` monta el entrypoint modular, mientras Swagger escanea `src/routes/**/*.ts`. Reexportar el router legacy mantiene una única instancia de rutas y conserva los comentarios OpenAPI.

La prueba arquitectónica verifica identidad de exports de controller/service y de routers, evitando que aparezca una segunda implementación.
