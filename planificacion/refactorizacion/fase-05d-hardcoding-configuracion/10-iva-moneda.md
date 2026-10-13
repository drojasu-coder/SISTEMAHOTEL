# IVA y moneda

## IVA

El fallback técnico de IVA 12 permanece en el módulo de configuraciones. No
se movió a `.env` ni se cambió la regla de `/api/configuraciones/iva`.

## Moneda

`GTQ` es una regla de dominio del sistema, no una configuración de deployment.
Se centralizó como `PAYMENT_CURRENCY` y se reutilizó en validator, service y
Stripe sin cambiar el valor, mensajes ni contrato.
