# 9. Matriz de riesgos

| Módulo | Riesgo | Evidencia | Motivo |
|---|---|---|---|
| Pagos/Stripe | Crítico | transacciones, locks, integración externa, webhook | dinero, idempotencia y estados cruzados |
| Reservas habitación | Crítico | concurrencia, locks, pruebas PostgreSQL | disponibilidad y doble reserva |
| Carritos | Alto | servicios grandes y coordinación con pagos | totales, expiración y origen de pago |
| Transporte/eventos/amenidades | Alto | transacciones y reservas | disponibilidad y estados |
| Auth/usuarios | Alto | JWT, roles, usuario activo | superficie de seguridad |
| Facturación/proveedores | Medio | múltiples modelos pero menor cobertura | efectos administrativos |
| Catálogos simples | Bajo/medio | CRUD y menor coordinación | buenos candidatos si tienen contrato probado |
| Observabilidad/configuración | Bajo | transversal, pruebas unitarias | riesgo acotado si no cambia contratos |

Los cambios recientes de José elevan el riesgo de conflicto en configuración, seguridad, middleware, auth, reservas y pagos. La criticidad no se decide sólo por tamaño: combina transacciones, integraciones, seguridad, cobertura y endpoints afectados.

