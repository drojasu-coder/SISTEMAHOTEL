# Inventario de hardcoding

La infraestructura existente en `src/config/env.ts` ya centraliza y valida
PORT, NODE_ENV, base de datos, JWT, Stripe, CORS, logging, límites y rate
limit. No se creó una segunda capa de configuración.

Hallazgo aplicado:

| Ubicación conceptual | Antes | Clasificación | Después |
|---|---|---|---|
| validator/service/Stripe | métodos, tipos y `GTQ` repetidos | `REGLA_DOMINIO` | `constants/payments.ts` |

Los literales de estados, rutas, mensajes y ejemplos no se modificaron por
ser contratos o reglas que requieren evidencia específica.
