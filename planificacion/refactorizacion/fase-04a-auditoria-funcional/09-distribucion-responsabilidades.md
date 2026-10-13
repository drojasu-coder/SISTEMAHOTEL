# Distribución provisional de responsabilidades

| Responsable | Tarea | Dominio/archivos probables | Dependencias | Prioridad | Aceptación |
|---|---|---|---|---|---|
| José | Entregar matriz de sus 36 endpoints y continuar reglas funcionales acordadas | amenidades/reservas y dominios que confirme | lista de reglas y fixtures | Alta | cada fila tiene prueba o bloqueo explícito |
| José | Completar validación de reservas auxiliares | `src/services/**/reserva*`, validators/routes correspondientes | baseline PostgreSQL | Crítica | estados, errores y límites probados |
| José | Revisar pagos, reembolsos y facturación | `src/services/pago*`, `pagos/`, `habitaciones/factura*` | fixtures, Stripe mock | Crítica | contratos y estados verificados |
| Diego | Mantener infraestructura de pruebas y PostgreSQL aislado | `tests/`, configuración env/Sequelize | no cambiar contratos | Alta | suites reproducibles y limpias |
| Diego | Mantener seguridad transversal y observabilidad | `config/`, middlewares, utils | revisión conjunta | Alta | JWT, roles, errores, request IDs pasan |
| Diego | Verificar OpenAPI y contratos | `docs/swagger.ts`, tests OpenAPI, rutas | cambios de José publicados | Media | operaciones/responses comparadas |
| Diego | Preparar integración controlada | Git y documentación de fase | autorización explícita | Alta | matriz de conflictos y plan aprobado |

La división es provisional. Nadie debe editar simultáneamente `app.ts`, configuración Sequelize, modelos/migraciones, autenticación o services críticos sin acuerdo previo. José debe anunciar commits por módulo; Diego debe evitar modificar reglas funcionales mientras construye regresiones.
