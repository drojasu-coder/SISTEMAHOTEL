# 12. Compatibilidad con José

## Confirmado por Git

Existe `origin/hardening/backend-final` y se comparó con `HEAD` sin modificar referencias. La rama de José diverge en configuración, `.env.example`, Sequelize, `app.ts`, middleware de errores/validación/request logging, modelos index, Stripe, servicios de reservas, pruebas y documentación. El resumen muestra eliminaciones sustanciales en esa rama respecto a nuestra línea.

## Archivos de conflicto probable

`backend/src/app.ts`, `src/config/env.ts`, `src/middlewares/*`, `src/server.ts`, `src/services/habitaciones/reservaHabitacion.service.ts`, `src/services/stripe.service.ts`, pruebas y documentación de fases. Son superficies compartidas y no deben modificarse simultáneamente sin coordinación.

## Desconocido

No se hizo `git fetch`; la referencia remota local puede no reflejar el servidor actual. No se realizó merge ni se inspeccionaron intenciones de los cambios. No se debe afirmar compatibilidad semántica sólo por el diff.

## Estrategia futura

Congelar una matriz de archivos antes de integrar, acordar propietario por superficie, integrar primero configuración/middleware, ejecutar tests después de cada grupo y resolver conflictos manualmente. Nunca usar `git reset --hard`, `git clean` o una integración automática que pueda borrar cambios locales.

