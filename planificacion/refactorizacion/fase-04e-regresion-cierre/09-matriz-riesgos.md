# Matriz única de riesgos pendientes

| ID | Dominio | Hallazgo | Tipo | Severidad | Responsable | Destino | Bloquea F5 | Bloquea frontend | Bloquea José | Negocio |
|---|---|---|---|---|---|---|---|---|---|---|
| R-01 | Stripe | no hay deduplicación explícita por `event.id` | RIESGO_TECNICO | alta | Diego/arquitectura | decisión técnica | no | posible | no | sí |
| R-02 | Facturación | relación con Pago/Carrito no definida | REGLA_AMBIGUA | alta | negocio + Diego | contrato futuro | no | sí | sí | sí |
| R-03 | Pagos | Stripe y commit local no son transacción distribuida | RIESGO_TECNICO | alta | Diego | diseño técnico | posible | sí | no | no |
| R-04 | Facturación | item y recálculo no son atómicos | RIESGO_TECNICO | alta | Diego | pruebas/corrección autorizada | posible | sí | no | no |
| R-05 | Reservas auxiliares | SELECT → escritura sin lock equivalente | RIESGO_TECNICO | media | Diego/José | pruebas + decisión | no | posible | sí | sí |
| R-06 | Contratos | cobertura HTTP específica incompleta | FALTA_COBERTURA | media | Diego | pruebas | no | sí | no | no |
| R-08 | Facturación | ownership service no demostrado en todos los paths | FALTA_COBERTURA | alta | Diego | seguridad | posible | sí | sí | no |
| R-09 | Configuración | IVA, estados y constantes repetidas | DEUDA_TECNICA | media | Diego | Fase 5 | no | no | no | no |
| R-10 | Legacy | fachadas/adapters requieren clasificación | ARCHIVO_OBSOLETO | baja | Diego | Fase 5 | no | no | no | no |

R-07 queda resuelto: `db:migrate:status` confirmó 41 migraciones `up`, 0
`down`, sin error ni drift reportado, usando la misma base aislada de las
pruebas.

Ningún riesgo activo de esta tabla es un defecto confirmado sin reproducción
determinista o contrato explícito.
