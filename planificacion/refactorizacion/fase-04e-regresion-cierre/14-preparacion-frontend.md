# Preparación frontend

| Dominio | Estado | Motivo |
|---|---|---|
| Auth/errores | ESTABLE | pruebas HTTP y seguridad existentes |
| Sucursales/configuraciones | ESTABLE | módulos piloto y pruebas |
| Habitaciones/reservas | PARCIALMENTE_ESTABLE | habitaciones protegidas; auxiliares con riesgos |
| Carritos | PARCIALMENTE_ESTABLE | ownership y precios backend, referencias sin precio |
| Pagos/Stripe | REQUIERE_DECISION | estados, reintentos e idempotencia |
| Facturas | NO_LISTO | relación con pago/carrito y ownership incompletos |
| Configuraciones/IVA | REQUIERE_DECISION | contrato coordinado con Diego |
| Fechas/paginación/filtros | PARCIALMENTE_ESTABLE | revisar por dominio |
| S3/tiempo real | REQUIERE_DECISION | no forman parte de la baseline validada |

No se creó ni modificó `Frontend/`. La Fase 6 debe recibir contratos
consolidados después de la limpieza y decisiones pendientes.
