# 3. Hallazgos verificables

## H1 — Servicios con responsabilidades acumuladas

`pago.service.ts` mide aproximadamente 28.9 KB y concentra creación de pagos, validación de ownership, idempotencia, reservas de carrito, webhooks, transferencias y reembolsos. Es un hecho observable por sus funciones y transacciones; no implica que toda extracción sea segura.

`carritoItem.service.ts` (~19.8 KB), `reservaHabitacion.service.ts` (~15.6 KB) y `reservaTransporte.service.ts` (~13.5 KB) también concentran múltiples casos de uso.

## H2 — Persistencia acoplada a casos de uso

Los servicios importan modelos Sequelize y pasan opciones `transaction`/`lock` directamente. Esto hace visible la persistencia y dificulta sustituirla en unit tests, aunque conserva control explícito sobre PostgreSQL.

## H3 — Composition root amplio

`app.ts` conoce cada ruta y también configura seguridad, parsers, Swagger, health y Stripe. Es un punto de composición válido, pero aumenta conflictos y hace costoso añadir dominios.

## H4 — Contratos OpenAPI embebidos en rutas

Varias rutas superan 9–11 KB principalmente por anotaciones OpenAPI. Esto aumenta conflictos de edición y mezcla documentación con composición HTTP.

## H5 — Cobertura desigual

La cobertura se concentra en auth, pagos, reservas y middleware. Muchos servicios y controladores no tienen pruebas directas; por tanto, una migración de módulo sin pruebas de contrato tendría riesgo alto.

## No confirmado

El análisis estático de imports relativos no confirmó ciclos. Tampoco se afirmó una violación de regla de negocio sólo por tamaño. La existencia de dependencias transitivas vulnerables de `uuid` vía Sequelize permanece documentada en Fase 2C-S.

