# Matriz de conflictos potenciales

La última modificación de la referencia local de José afecta `backend/src/routes/amenidades/reservaAmenidad.routes.ts`, `backend/src/services/amenidades/reservaAmenidad.service.ts` y `backend/src/validators/amenidades/reservaAmenidad.validator.ts`. No coincide textualmente con los archivos de nuestros pilotos.

| Área | Conflicto textual | Conflicto semántico | Acción |
|---|---|---|---|
| `app.ts` | Bajo en la referencia observada | Medio si José cambia montaje o middlewares | Comparar y probar composición completa |
| Configuración Sequelize/env | No observado | Alto si cambia ambiente o conexión | Revisión conjunta, sin resolver automáticamente |
| Autenticación/middlewares | No observado | Alto | Ejecutar JWT, roles, CORS y errores |
| Pilotos modularizados | No observado | Medio si se cambian fachadas/imports | Ejecutar arquitectura y OpenAPI |
| Amenidades/reservaAmenidad | Posible en referencia futura | Alto por reglas de reserva | Pruebas PostgreSQL específicas |
| Reservas | No observado en último commit | Alto | No integrar sin regresión de concurrencia |
| Pagos/Stripe | No observado en último commit | Alto | Validar webhook, ownership y contratos |
| Facturación/carrito | No observado | Medio/alto | Revisar dependencias funcionales |
| Migraciones/modelos | No observado | Crítico si aparece | Detener y solicitar revisión conjunta |

Git identifica cambios de archivo, no conflictos de comportamiento, transacciones o contratos. La clasificación semántica debe validarse manualmente en la integración autorizada.
