# Pendientes para José

| ID | Endpoint/regla | Evidencia faltante | Archivos probables | Prioridad | Prueba requerida | Aceptación |
|---|---|---|---|---|---|---|
| JOSE-01 | Lista de 36 endpoints | El commit sólo afirma 17 corregidos | documentación o commits de cada dominio | alta | matriz endpoint/regla/prueba | cada endpoint queda clasificado |
| JOSE-02 | Reservas amenidad | No hay suite específica completa | route/service/validator de amenidades | alta | PostgreSQL y HTTP | estados, validaciones y errores verificables |
| JOSE-03 | Reservas auxiliares | Evidencia desigual para actividad, evento, mesa, parqueo, spa y transporte | services `reserva*` y routes | crítica | integración por dominio | no solapamiento/estados probados |
| JOSE-04 | Pagos/reembolsos | Idempotencia y estados sólo parcialmente cubiertos | `pago.service.ts`, controller y routes | crítica | fixtures/mocks sin Stripe real | ownership, aprobación y reembolso cubiertos |
| JOSE-05 | Facturación/IVA | Totales y estados sin contrato PostgreSQL específico | factura services/routes y configuración | alta | PostgreSQL aislado | importes y errores comprobados |
| JOSE-06 | Carritos | Operaciones anidadas sin suite completa | carrito services/routes | alta | integración aislada | expiración/items/errores documentados |

Dependencia con Diego: no modificar simultáneamente infraestructura transversal, OpenAPI, `app.ts`, modelos/migraciones o configuración de pruebas sin acuerdo. José debe entregar la matriz antes de afirmar cobertura completa.
