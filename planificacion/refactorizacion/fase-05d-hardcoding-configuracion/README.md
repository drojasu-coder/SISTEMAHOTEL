# Fase 5D — Hardcoding y configuración

## Resultado

Se centralizaron constantes de dominio de pagos que estaban duplicadas entre
validator, service y Stripe:

- métodos de pago;
- tipos de pago;
- moneda de pago `GTQ`.

No se movieron reglas de negocio a variables de entorno, no se modificaron
defaults de configuración y no se alteraron contratos HTTP u OpenAPI.

## Decisión

**GO_FASE_5E**

La decisión se concede tras validar tests, TypeScript y OpenAPI, sin exponer
secretos ni cambiar comportamiento observable.

Fase 5E no se inicia en este cambio.
