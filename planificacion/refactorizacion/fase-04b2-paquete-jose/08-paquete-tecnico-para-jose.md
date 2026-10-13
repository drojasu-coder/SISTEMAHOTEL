# Paquete técnico para José

## Situación

El baseline de inicio de la Fase 4B-2 es `e7bc4e5` en `refactor/backend-architecture`, con 65 pruebas y TypeScript correcto. Tu referencia histórica `83d0827` ya es ancestro; no hay commits publicados pendientes en la referencia local. La base operativa para tu trabajo será el commit final publicado de la Fase 4B-2, cuyo SHA Diego confirmará después de realizar el commit y push.

## Inicio recomendado

Después de autorización y de recibir el SHA confirmado por Diego, crea una rama desde el commit final publicado de la Fase 4B-2. No continúes directamente desde código antiguo sin sincronizar. Comienza con J1 (amenidades), el primer lote recomendado; J2 (servicios de reservas de evento) sólo comienza después de que Diego revise y acepte J1. No comiences con Stripe.

## Responsabilidad

Trabaja sólo reglas funcionales y pruebas del lote asignado. Evita `app.ts`, configuración, middlewares globales, módulos piloto, modelos/migraciones y pruebas de infraestructura sin avisar. Al trabajar facturación, verifica `/api/configuraciones/iva` como dependencia, pero no modifiques libremente `backend/src/modules/configuraciones/` ni sus fachadas/contrato; no cambies la regla o contrato de IVA para adaptar facturación sin autorización.

## Flujo

Ejecuta baseline, modifica un dominio, agrega pruebas PostgreSQL aisladas, ejecuta `npm test` y `npm run typecheck`, crea un commit descriptivo y reporta SHA, archivos, pruebas y riesgos. No hagas force push, no uses claves reales, no cambies contratos sin aprobación y no integres ramas.
