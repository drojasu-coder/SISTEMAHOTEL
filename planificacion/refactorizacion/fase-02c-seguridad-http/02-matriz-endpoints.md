# Matriz de endpoints, JWT y roles

La siguiente matriz resume los grupos observados en las rutas actuales.

| Grupo | Acceso observado | Roles adicionales | Validacion |
|---|---|---|---|
| `/api/health` | Publico | Ninguno | N/A |
| `/api/docs` | Publico | Ninguno | Swagger |
| `/api/auth/register` | Publico | Ninguno | Body Zod |
| `/api/auth/login` | Publico | Ninguno | Body Zod + rate limit |
| `/api/auth/me` | JWT | Usuario autenticado | JWT |
| `/api/pagos/stripe/webhook` | Proveedor Stripe | Firma Stripe, sin JWT | Raw body |
| `/api/pagos/*` | JWT | Algunos endpoints de gestion | Body/query/params Zod |
| `/api/usuarios/*` | JWT | Administracion en rutas protegidas | Zod |
| Reservas, carritos y servicios | Segun ruta | Roles donde el codigo lo declara | Zod |

No se cambiaron permisos. La existencia de acceso publico en cada endpoint
particular debe seguir revisandose en la auditoria funcional de rutas.
