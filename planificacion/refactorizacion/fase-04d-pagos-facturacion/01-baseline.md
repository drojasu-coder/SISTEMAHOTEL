# Baseline

| Comprobación | Resultado |
|---|---|
| Rama | `refactor/backend-architecture` |
| HEAD | `f5ae3d2` |
| José | `origin/hardening/backend-final` en `83d0827`, sin commits por delante en referencia local |
| Pruebas | 65 exitosas: 37 unitarias y 28 integración |
| TypeScript | `npm run typecheck` exitoso |
| HTTP/OpenAPI | 184 operaciones y 93 paths, según fase anterior |
| PostgreSQL | `TEST_DATABASE_URL` apunta a la base aislada `hotel_test_db` |

La prueba existente `postgres.payments.test.ts` verifica ownership de pagos vinculados a carrito e índice de idempotencia. `stripe.service.test.ts` verifica conversión GTQ, moneda inválida, monto no positivo y firma local inválida/válida. No se realizaron llamadas externas a Stripe ni operaciones financieras reales.

El árbol ya contiene cambios protegidos ajenos a esta fase; no fueron modificados.
