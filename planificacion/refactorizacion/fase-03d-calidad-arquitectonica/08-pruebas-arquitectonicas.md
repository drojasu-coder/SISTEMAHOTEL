# Pruebas arquitectónicas

La prueba nueva no usa rutas absolutas del equipo: calcula `src` desde `import.meta.url`. Recorre archivos TypeScript, resuelve sólo imports relativos existentes y detecta ciclos mediante una búsqueda DFS.

Además, importa módulos y adapters reales para comprobar que las fachadas no crean implementaciones paralelas. La ejecución dirigida reportó 5 pruebas exitosas junto con la regresión OpenAPI.
