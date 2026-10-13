# CORS, límites y rate limit

La configuración ya estaba centralizada en `src/config/httpSecurity.ts` y
`src/config/env.ts`. Se conservaron:

- orígenes permitidos y rechazo de orígenes desconocidos;
- `REQUEST_BODY_LIMIT` y `WEBHOOK_BODY_LIMIT`;
- ventana y máximo del rate limit de autenticación;
- headers, métodos y status de preflight.

No se abrió CORS con `*` ni se cambió ningún tamaño efectivo.
