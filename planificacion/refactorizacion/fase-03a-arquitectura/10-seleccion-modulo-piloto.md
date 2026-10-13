# 10. Selección del módulo piloto

## Candidatos

### A. Conversión Stripe

Archivos: `stripe.service.ts` y su prueba unitaria. Riesgo bajo; frontera pequeña y lógica de montos comprobable. Beneficio: primera convención de integración. Riesgo: tocar pagos puede generar conflicto con José aunque no se toque el webhook.

### B. Ownership de pagos

Archivos: `utils/paymentOwnership.ts`, servicio de pagos y pruebas existentes. Riesgo bajo/medio; política focalizada y ya probada. Beneficio: validar módulo de política sin tocar transacciones. Riesgo: dependencia semántica de pagos.

### C. Catálogo simple

Un recurso de catálogo como sucursal, salón o configuración puede extraerse con route/controller/service/validator y pruebas HTTP. Riesgo medio por cobertura desigual y por identificar el catálogo exacto en el código. Beneficio: prueba real de montaje modular sin tocar reservas.

## Recomendación

Recomiendo **ownership de pagos** como primer piloto técnico si se autoriza una extracción de utilidad; si se requiere validar un módulo HTTP completo, seleccionar un catálogo simple después de añadir pruebas de contrato. No recomiendo pagos completos, habitaciones, carrito ni reservas como primer piloto: sus transacciones y efectos cruzados hacen difícil distinguir errores arquitectónicos de regresiones de negocio.

En esta fase no se refactorizó ningún candidato.

