# Mensaje breve para José

José, el baseline de inicio de la Fase 4B-2 es `e7bc4e5` en `refactor/backend-architecture`. Cuando Diego publique el commit final de esta fase y confirme su SHA después del commit/push, crea una rama nueva desde ese commit; no continúes directamente sobre código antiguo.

Primer lote recomendado: J1, reservas de amenidades. J2, servicios asociados a reservas de evento, sólo debe comenzar después de que Diego revise y acepte J1; no empieces con Stripe. Antes y después ejecuta `cd backend && npm test && npm run typecheck`. Trabaja un dominio por commit, añade pruebas PostgreSQL aisladas y avisa con el SHA, archivos, endpoints, regla, pruebas y riesgos. No toques `app.ts`, configuración, modelos/migraciones ni middlewares globales sin coordinación. Para facturación, verifica `/api/configuraciones/iva` como dependencia, pero no modifiques `backend/src/modules/configuraciones/` ni sus fachadas/contrato, ni cambies la regla o contrato de IVA sin autorización.
