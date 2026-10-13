# 05 — Plan incremental de refactorización

La autorización para ejecutar cada fase debe ser explícita. Ninguna fase modifica `main` o `hardening/backend-final`, migra datos existentes o edita migraciones aplicadas.

## Fase 0 — Caracterización y congelamiento

- **Objetivo:** convertir el estado actual en una línea base reproducible.
- **Archivos/módulos:** documentación de auditoría, OpenAPI, `src/app.ts`, rutas, controllers, validators y servicios de reservas/pagos.
- **Cambios:** pruebas de contrato para rutas críticas, snapshots de envelopes y matriz 401/403/404/409/422; sin cambio funcional.
- **Dependencias:** ninguna.
- **Riesgo:** fixtures incompletos o diferencias entre OpenAPI y ejecución.
- **Aceptación:** matriz de 184 operaciones; pruebas para auth, reservas, carrito, pagos y webhook; `tsc` pasa.
- **Reversión:** eliminar solo pruebas/documentación nuevas.

## Fase 1 — Configuración e infraestructura segura (A)

- **Objetivo:** separar configuración, errores y validación sin cambiar contratos.
- **Archivos:** `config/config.json`, `config/env.ts`, `app.ts`, middlewares y `AppError`.
- **Cambios:** DSN/credenciales por env validada; serialización de error central; helper común para detalles Zod; allowlist CORS por ambiente.
- **Dependencias:** Fase 0.
- **Riesgo:** despliegues que dependan de defaults y webhook raw.
- **Aceptación:** arranque falla con configuración inválida; respuestas de error idénticas; prueba raw de Stripe pasa.
- **Reversión:** feature flag/configuración compatible; no tocar datos.

## Fase 2 — Contratos y adapters de persistencia (A)

- **Objetivo:** reducir acoplamiento sin cambiar rutas.
- **Archivos:** un módulo piloto de catálogo y uno de reservas; nuevos adapters/repositories internos.
- **Cambios:** interfaces tipadas, repositorio detrás del service, serializadores explícitos; mantener modelos JS y Sequelize inicialmente.
- **Dependencias:** Fases 0–1.
- **Riesgo:** includes, nombres de columnas y errores Sequelize.
- **Aceptación:** pruebas de contrato idénticas antes/después y cobertura de errores de FK/unique.
- **Reversión:** mantener implementación anterior seleccionable por configuración durante la migración del módulo.

## Fase 3 — Extraer políticas de reservas (A)

- **Objetivo:** reutilizar reglas de fechas, traslapes, ownership y transiciones.
- **Archivos:** services/validators de habitación, parqueo, mesa, actividad y amenidad.
- **Cambios:** helpers/policies puros y pequeños; mover primero reglas duplicadas, sin renombrar estados ni códigos.
- **Dependencias:** Fase 2 y pruebas de Fase 0.
- **Riesgo:** diferencias en límites temporales y estados cancelados.
- **Aceptación:** suite de casos frontera y comparación de respuestas con baseline; pruebas concurrentes de disponibilidad.
- **Reversión:** revertir por módulo, nunca todos los dominios a la vez.

## Fase 4 — Descomponer pagos (A, alta sensibilidad)

- **Objetivo:** separar cálculo, ownership, persistencia, Stripe, reembolsos y estados.
- **Archivos:** `pago.service.ts`, `stripe.service.ts`, `paymentOwnership.ts`, controller/routes y modelos.
- **Cambios:** casos de uso/adapters con transacción explícita; tipos de monto/estado; conservar idempotency key y locks.
- **Dependencias:** Fases 0–3; PostgreSQL real para pruebas.
- **Riesgo:** doble cobro, reembolso duplicado, webhook no idempotente.
- **Aceptación:** pruebas de idempotencia, concurrencia, firma inválida, replay de webhook y montos de dos decimales.
- **Reversión:** feature flag por operación y recuperación de versión anterior del service; nunca borrar registros.

## Fase 5 — Wiring de rutas y controllers (A)

- **Objetivo:** hacer delgadas las rutas y uniformar composición de middleware.
- **Archivos:** 38 routers, controllers y schemas/OpenAPI.
- **Cambios:** factories de CRUD solo donde sean semánticamente equivalentes; separar comentarios Swagger; matriz declarativa de auth/roles.
- **Dependencias:** contratos congelados y policies probadas.
- **Riesgo:** endpoint público accidental, cambio de orden middleware.
- **Aceptación:** snapshot de métodos/rutas/middleware; tests 401/403 y OpenAPI sin drift.
- **Reversión:** migrar router por módulo conservando mounts de `app.ts`.

## Fase 6 — Rendimiento y observabilidad (A)

- **Objetivo:** medir antes de optimizar consultas.
- **Archivos:** services/repositories, logging y configuración.
- **Cambios:** paginación opt-in, atributos explícitos, índices solo mediante migraciones nuevas justificadas, correlation ID y métricas.
- **Dependencias:** adapters y contratos.
- **Riesgo:** alterar orden, cantidad o forma de datos.
- **Aceptación:** benchmark de listados y reservas; no se agregan índices sin plan de reversión y prueba sobre copia.
- **Reversión:** desactivar paginación/telemetría no crítica; una migración de índice se revierte con nueva migración compensatoria.

## Clasificación de trabajo

- **A — Refactor interno sin cambio funcional:** Fases 1–3, 5–6.
- **B — Corrección de defectos existentes:** solo después de reproducirlos con una prueba y registrarlos aparte.
- **C — Regla de negocio pendiente:** ticket y aceptación propios; no mezclar con extracción.
- **D — Nueva funcionalidad:** contrato, migración, pruebas y documentación separados.

## Orden de ejecución

Fase 0 → Fase 1 → Fase 2 → Fase 3 por módulos → Fase 4 pagos → Fase 5 → Fase 6. Cada módulo debe entrar en una rama propia y una revisión independiente.
