# Grafo de consumidores

El entrypoint monta las rutas modulares de sucursales y configuraciones en
`src/app.ts`. Los adapters modulares reexportan los routers legacy y los
controllers/services legacy reexportan la implementación modular.

`tests/unit/architecture.test.ts` verifica:

- igualdad de exports entre fachadas legacy y módulos;
- igualdad entre routers legacy y adapters modulares;
- ausencia de ciclos de imports relativos.

Swagger descubre `src/routes/**/*.ts`; por ello los routers bajo `src/routes`
no son huérfanos aunque exista un adapter en `src/modules`.
