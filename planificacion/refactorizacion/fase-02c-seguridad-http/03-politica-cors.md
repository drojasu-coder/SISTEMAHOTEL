# Politica CORS

`CORS_ORIGINS` acepta una lista separada por comas. En desarrollo y pruebas,
si no se define, se permiten `http://localhost:3000` y
`http://localhost:5173`. En produccion la variable es obligatoria.

Las solicitudes sin `Origin` se permiten para clientes backend y proveedores
como Stripe. Los origenes de navegador no incluidos reciben 403
`CORS_ORIGIN_DENIED`. No se habilitan credenciales CORS.

Se permiten metodos HTTP habituales y las cabeceras `Authorization`,
`Content-Type` y `Stripe-Signature`. OPTIONS responde 204.
