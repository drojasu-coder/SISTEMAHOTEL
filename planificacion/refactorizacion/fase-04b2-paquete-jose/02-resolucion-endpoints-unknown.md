# Resolución de los cinco endpoints `UNKNOWN`

El parser anterior buscaba la cadena de path en la misma ventana textual que la llamada `router.*(`. En este router el path aparece en el comentario OpenAPI y la llamada usa una cadena en una línea posterior, con argumentos multilinea; por eso no pudo resolverlos automáticamente.

El archivo se monta en `app.ts` como `/api/reservas-evento` y el router interno usa `mergeParams: true`. El prefijo funcional del router padre es `/api/reservas-evento/:reservaId/servicios`.

| ID anterior | Método | URL completa | Línea | Middleware/auth | Validación | Controller/service | OpenAPI | Evidencia |
|---|---|---|---:|---|---|---|---|---|
| `GET_UNKNOWN_56` | GET | `/api/reservas-evento/:reservaId/servicios` | 87 | `authMiddleware` vía `router.use` | `reservaEventoParamSchema` | `controller.getAll` → `service.getAll` | Sí, línea 34 | Inspección; sin prueba específica |
| `GET_UNKNOWN_57` | GET | `/api/reservas-evento/:reservaId/servicios/:id` | 147 | `authMiddleware` vía `router.use` | `reservaEventoServicioParamsSchema` | `controller.getById` → `service.getById` | Sí, línea 97 | Inspección; sin prueba específica |
| `POST_UNKNOWN_58` | POST | `/api/reservas-evento/:reservaId/servicios` | 239 | `authMiddleware` vía `router.use` | params + `createReservaEventoServicioSchema` | `controller.create` → `service.create` | Sí, línea 157 | Inspección; sin prueba específica |
| `PATCH_UNKNOWN_59` | PATCH | `/api/reservas-evento/:reservaId/servicios/:id` | 324 | `authMiddleware` vía `router.use` | params + `updateReservaEventoServicioSchema` | `controller.update` → `service.update` | Sí, línea 252 | Inspección; sin prueba específica |
| `DELETE_UNKNOWN_60` | DELETE | `/api/reservas-evento/:reservaId/servicios/:id` | 375 | `authMiddleware` vía `router.use` | `reservaEventoServicioParamsSchema` | `controller.remove` → `service.remove` | Sí, línea 337 | Inspección; sin prueba específica |

El service verifica propietario o ADMIN, existencia de la reserva, estado de cotización y relaciones `ReservaEvento`, `ReservaEventoServicio`, `ServicioEvento` y `Salon`. Las operaciones de modificación usan transacciones Sequelize; no se alteró nada.
