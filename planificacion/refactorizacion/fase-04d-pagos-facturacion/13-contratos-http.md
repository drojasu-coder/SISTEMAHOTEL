# Contratos HTTP observados

| Área | Rutas principales | Respuestas observadas |
|---|---|---|
| Pagos | `POST/GET /api/pagos`, `GET /api/pagos/:id`, resumen, aprobar transferencia, reembolso | 201 creación, 200 consultas/acciones, 400 validación, 401/403/404/409/422 según caso |
| Webhook | `POST /api/pagos/stripe/webhook` | 200 `{ received: true }`; firma/raw inválidos producen 400 |
| Carritos | rutas `/api/carritos` y `/api/carritos/:carritoId/items` | auth, ownership, estado activo, 404/409/422 |
| Facturas | `/api/facturas` y `/api/factura-items` | CRUD y errores de recurso/relación |
| IVA | `GET/PATCH /api/configuraciones/iva` | módulo modularizado bajo coordinación de Diego |

Los mensajes y códigos no se normalizaron. Swagger documenta ejemplos de PaymentIntent y estados, pero no demuestra persistencia ni procesamiento real.
