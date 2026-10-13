# Controllers y services

Las fachadas de configuración y sucursales son reexports deliberados, no
duplicación funcional. `architecture.test.ts` compara sus exports con los
módulos y prueba que apuntan a las mismas funciones.

Los servicios restantes tienen consumidores desde sus routers/controllers o
desde otros servicios. No se eliminó ningún controller/service.
