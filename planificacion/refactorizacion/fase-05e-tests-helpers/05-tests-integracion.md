# Tests de integración

Las cinco suites de integración separan responsabilidades:

- HTTP/Supertest valida middleware, contratos y seguridad;
- auth valida persistencia junto con HTTP;
- pagos valida ownership e índice de idempotencia;
- reservas valida solapamientos, rollback y concurrencia;
- sucursales valida el módulo piloto y reglas de conflicto.

Un test de servicio y uno HTTP no se consideran duplicados: ejercitan capas
distintas. No se consolidaron suites.
