# Matriz de reglas de negocio

| ID | Dominio | Regla observada | Evidencia | Prueba | Estado/riesgo | Responsable |
|---|---|---|---|---|---|---|
| AUTH-01 | Identidad | JWT debe ser válido y no expirado; usuario inactivo se rechaza | `auth.middleware.ts`, `postgres.auth.test.ts` | Sí | Confirmada; alto | Diego |
| AUTH-02 | Autorización | Operaciones administrativas usan `requireRole` | routers y `postgres.auth.test.ts` | Parcial | Implementada con cobertura desigual; alto | Diego |
| RES-01 | Habitación | creación y cambios de reserva deben respetar disponibilidad/concurrencia | `reservaHabitacion.service.ts`, `postgres.reservations.test.ts` | Sí | Confirmada; crítico | José/Diego |
| RES-02 | Reservas auxiliares | estados, cancelación o asignación dependen de cada service | services de reservas | Parcial | Implementada con prueba insuficiente; alto | José |
| PAY-01 | Pagos | webhook requiere cuerpo raw y firma Stripe | `app.ts`, pago controller/service, HTTP test | Sí | Confirmada; crítico | José |
| PAY-02 | Pagos | reembolso y aprobación de transferencia dependen de roles/estado | pago routes/service | Parcial | Implementada sin matriz completa de estados; crítico | José |
| CART-01 | Carrito | carrito actual y items usan rutas anidadas | routers carrito | No completa | Evidencia parcial; alto | José |
| BILL-01 | Facturación | factura e items tienen CRUD y recálculo de totales en service | factura services | No específica | Implementada sin suficiente prueba; alto | José |
| IVA-01 | Configuración | si no existe configuración IVA se crea con valor 12 | configuración service modular | indirecta | Confirmada por inspección; medio | Diego |
| BRANCH-01 | Sucursales | no se elimina sucursal en uso; devuelve conflicto | sucursal service/controller | Sí | Confirmada; medio | Diego |
| CAT-01 | Catálogos | validadores Zod preceden operaciones de escritura | routers/validators | Parcial | Convención confirmada, cobertura desigual | José |

## Clasificación adicional

- **Confirmadas:** AUTH-01, RES-01, PAY-01, IVA-01, BRANCH-01, respaldadas por código y pruebas o inspección directa.
- **Implementadas sin suficiente prueba:** AUTH-02, RES-02, PAY-02, BILL-01, CAT-01.
- **Incompletas comprobadas:** no se reprodujo una regla incompleta durante esta auditoría.
- **Ambiguas:** alcance exacto de los “36 endpoints” de José y estados permitidos para cada reserva/pago.
- **Propuestas no aprobadas:** ampliar idempotencia, normalizar DTOs o cambiar estados; deben aprobarse antes de implementarse.
