# Riesgos priorizados

| Prioridad | Área | Riesgo | Evidencia | Acción sin implementar |
|---|---|---|---|---|
| Crítica | Reservas | estados, solapamientos y concurrencia no tienen cobertura uniforme en todos los subdominios | una suite concentrada en habitación | 4B/4C: matriz de estados y pruebas PostgreSQL |
| Crítica | Pagos/Stripe | idempotencia, reembolsos y sincronización de estados requieren más casos | cobertura parcial | 4D: pruebas con fixtures, sin claves reales |
| Alta | Facturación | totales, IVA y estados carecen de contrato de integración completo | inspección de services | 4B/4D: pruebas aisladas |
| Alta | Carritos | operaciones anidadas y expiración no tienen suite específica completa | routes/services | 4B/4D: validar invariantes |
| Alta | Trabajo de José | lista exacta de 36 endpoints no está documentada | sólo mensaje de commit | solicitar matriz endpoint/regla/prueba |
| Media | OpenAPI | 93 paths documentados, pero schemas/responses no cubren todos los contratos | artifact y pruebas de pilotos | ampliar por prioridad |
| Media | Integración Git | referencia local puede quedar desactualizada | no se ejecutó fetch en esta fase | solicitar autorización antes de actualizar |
| Baja | Catálogos | CRUD repetitivo con evidencia desigual | inventario de routers | pruebas por grupos después de críticos |

No se reprodujeron defectos funcionales durante la auditoría. Los riesgos indican falta de evidencia o posibles áreas de inconsistencia, no fallos confirmados.
