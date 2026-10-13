# Fase 1B — Criterios para autorizar Fase 2

La Fase 2 no queda autorizada por este informe. Antes de iniciarla se requiere:

1. Mantener una ejecución reproducible de migraciones en la base aislada.
2. Añadir pruebas de concurrencia con conexiones/transacciones independientes y
   timeouts para habitación, parqueo, mesa y actividad.
3. Completar fixtures y pruebas de amenidades, carrito, expiración, rollback,
   reembolsos, transferencias y replay/idempotencia de webhooks.
4. Comparar por operación autenticación, roles, validadores, esquemas y respuestas
   contra OpenAPI.
5. Registrar explícitamente cualquier defecto y decidir si es corrección separada,
   regla pendiente o nueva funcionalidad.
6. Conservar la suite actual verde y confirmar `typecheck`.

La primera refactorización autorizada debería ser interna, incremental y cubierta por
estas pruebas, sin cambiar contratos públicos. Cada fase deberá incluir criterio de
aceptación, reversión y pruebas específicas.
