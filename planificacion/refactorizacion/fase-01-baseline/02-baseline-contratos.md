# 02 — Baseline de contratos

## Comparación de rutas

| Fuente | Resultado |
|---|---:|
| Declaraciones `router.get/post/patch/delete` en `src/routes` | 182 |
| `/api/health` declarado directamente en `app.ts` | 1 |
| Webhook raw declarado directamente en `app.ts` | 1 |
| Operaciones observadas en total | **184** |
| Operaciones en `backend/openapi.json` local | **184** |
| Paths OpenAPI | 93 |
| Routers importados/montados por `app.ts` | 38 módulos funcionales; 37 líneas `app.use` por montaje anidado |

El archivo `backend/openapi.json` se trató como documentación local no rastreada. No se regeneró ni modificó.

## Contratos comprobados ejecutando código

| Caso | Observación | Categoría |
|---|---|---|
| `GET /api/health` | 200 y `{success:true,statusCode:200,message}` | Actual observado |
| `POST /api/auth/register` con body inválido | 400, `VALIDATION_ERROR`, `details` array | Actual observado |
| `GET /api/auth/me` sin Authorization | 401, `AUTH_TOKEN_REQUIRED` | Actual observado |
| `POST /api/pagos/stripe/webhook` sin firma/body raw válido | 400, `INVALID_WEBHOOK_REQUEST` | Actual observado |

## Contratos documentados pero aún no verificados con base

Registro/login válidos, `/auth/me` con usuario real, roles, ownership, CRUD de reservas, carrito, pagos persistidos, reembolsos y concurrencia. Requieren PostgreSQL aislado y fixtures controlados.

## Envelopes

- Éxito de módulos recientes: `{success,statusCode,message,data}`.
- Éxito legado: `{status:"success",data}`.
- Error central: `{success:false,statusCode,code,message,details?}`.

No se modificaron rutas ni OpenAPI para ocultar esta diferencia.
