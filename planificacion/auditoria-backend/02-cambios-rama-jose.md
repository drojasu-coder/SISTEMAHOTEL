# 02 — Cambios de `hardening/backend-final`

## Comparación utilizada

La rama se comparó contra `origin/backup/integration-pre-hardening` (`0ecc9c2`), que es el respaldo de integración inmediatamente anterior al hardening. La secuencia auditada es:

| Commit | Tema | Alcance |
|---|---|---|
| `a4102c1` | IPv4 local | `config.json`, conexión local a PostgreSQL. |
| `9752163` | Reservas de habitación | Controller, route, service y validator; reglas de fechas, disponibilidad, propiedad/roles y estados. |
| `d8db268` | Reservas de parqueo | Route, service y validator; validación, seguridad y disponibilidad. |
| `a8edff8` | Reservas de mesa | Controller, route, service y validator; disponibilidad y validaciones. |
| `92a43cf` | Reservas de actividad | Controller, route, service y validator; disponibilidad de recurso/instructor, rango horario y estado. |
| `83d0827` | Reservas de amenidad | Route, service y validator; el mensaje indica 17 endpoints corregidos. |

También se incorporaron cambios de pagos y soporte Stripe dentro del tramo relativo a la base:

- `pago.service.ts`, `stripe.service.ts`, `pago.controller.ts`, `pago.routes.ts`, `pago.validator.ts`.
- `reembolso.js`, cambios a `pago.js` y `carrito.js`.
- Tres migraciones nuevas: columnas de carrito/datos de pago y tabla `reembolsos`.
- Dos seeders de fixtures de pagos/Stripe.
- `paymentOwnership.ts` para restringir acceso a pagos del solicitante.
- `validateQuery` y ampliación de documentación Swagger.

## Archivos modificados o agregados por el hardening

La comparación completa reporta 46 archivos: 15 rutas/controladores/validadores de reservas y pagos, 10 servicios, 3 modelos/entidades, 3 migraciones, 2 seeders, middleware, utilidades, Swagger, configuración y documentación. Los archivos de negocio principales son:

- `src/controllers/actividades/reservaActividad.controller.ts`
- `src/controllers/habitaciones/reservaHabitacion.controller.ts`
- `src/controllers/restaurante/reservaMesa.controller.ts`
- `src/controllers/pagos/pago.controller.ts`
- `src/routes/actividades/reservaActividad.routes.ts`
- `src/routes/amenidades/reservaAmenidad.routes.ts`
- `src/routes/habitaciones/reservaHabitacion.routes.ts`
- `src/routes/habitaciones/reservaParqueo.routes.ts`
- `src/routes/restaurante/reservaMesa.routes.ts`
- `src/routes/pagos/pago.routes.ts`
- `src/services/actividades/reservaActividad.service.ts`
- `src/services/amenidades/reservaAmenidad.service.ts`
- `src/services/habitaciones/reservaHabitacion.service.ts`
- `src/services/habitaciones/reservaParqueo.service.ts`
- `src/services/restaurante/reservaMesa.service.ts`
- `src/services/pago.service.ts`

## Cambios funcionales observables

### Reservas

- Rechazo de fechas pasadas y rangos invertidos.
- Validación de duración y horas normalizadas en actividades.
- Detección de traslapes para habitación, parqueo, mesa, recurso e instructor.
- Comprobación de existencia de usuario, recurso, habitación, parqueo y entidades relacionadas.
- Restricción de acceso/actualización/cancelación al propietario o a roles autorizados.
- Validación de transiciones de estado y conservación del historial en cancelaciones.
- Mensajes y códigos `AppError` más específicos para conflictos, inexistencia y reglas de negocio.

### Pagos

- Creación de pagos para carrito o reserva de habitación con regla de origen exclusivo.
- Idempotencia y locks/transacciones en operaciones críticas.
- Aprobación de transferencia, procesamiento de reembolso y conciliación con Stripe.
- Webhook sin JWT, con verificación de `Stripe-Signature` sobre el cuerpo raw.
- Nuevo vínculo `pagos.carrito_id` y nueva entidad `reembolsos`.

### Contratos HTTP

- Se agregaron/documentaron rutas de pagos.
- Varios controladores de reservas cambiaron de `{status:"success",data}` a `{success,statusCode,message,data}`.
- Los cambios de status HTTP deben considerarse potencialmente incompatibles aunque la URL no haya cambiado.

## Validaciones añadidas o reforzadas

Los validators Zod de habitación, parqueo, mesa, actividad, amenidad y pagos restringen campos desconocidos, tipos, IDs, fechas, horas, montos, estados y combinaciones de entrada. `validateQuery` se incorporó al middleware común.

## Riesgos que requieren comprobación, no suposición

1. No existe suite automatizada que confirme todos los traslapes y transiciones.
2. La documentación OpenAPI no prueba que cada ruta tenga el mismo middleware efectivo.
3. Las migraciones nuevas deben probarse sobre una copia de esquema; no deben editarse las 41 migraciones históricas.
4. Los seeders de fixtures no deben ejecutarse sobre datos existentes sin una política de ambiente.
5. Las respuestas modificadas deben compararse con el cliente frontend antes de estandarizar.
6. Las transacciones y locks de pagos requieren pruebas concurrentes y una base PostgreSQL real.

## Dictamen de auditoría

El hardening introduce controles valiosos y debe preservarse. Su tamaño (más de 8.000 líneas agregadas/modificadas en el tramo completo) justifica extraer posteriormente políticas y casos de uso, pero **no** reescribirlo durante la primera fase. Cada extracción debe conservar primero los códigos, mensajes, estados, ownership y forma de respuesta observados.
