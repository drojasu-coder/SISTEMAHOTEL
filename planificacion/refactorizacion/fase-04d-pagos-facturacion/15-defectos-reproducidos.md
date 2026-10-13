# Defectos reproducidos

No se reprodujo un defecto mediante una prueba nueva o existente durante esta auditoría. No se modificó producción para fabricar resultados.

## Riesgos comprobados por inspección, no defectos reproducidos

| Severidad | Riesgo | Evidencia |
|---|---|---|
| Crítica | Stripe externo y transacción local no son atómicos | creación PaymentIntent dentro del callback transaccional |
| Alta | Webhook no registra `event.id` procesado | controller procesa eventos soportados sin tabla/evento |
| Alta | factura-item y recálculo no son atómicos | service crea item y luego actualiza factura |
| Alta | facturación no está enlazada a pago | no hay FK/asociación Pago-Factura |
| Media | factura puede recibir subtotal directo | `createFactura` usa `data.subtotal` |
| Media | carritos de algunos tipos no tienen precio | resolutores devuelven `ITEM_PRICE_NOT_AVAILABLE` |

Son hallazgos para decisión/revisión, no defectos funcionales confirmados sin escenario de negocio aprobado.
