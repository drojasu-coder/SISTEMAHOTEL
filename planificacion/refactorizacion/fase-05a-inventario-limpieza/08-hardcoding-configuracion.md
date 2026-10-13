# Hardcoding y configuración

| Hallazgo | Clasificación | Evidencia | Destino |
|---|---|---|---|
| `TEST_DATABASE_URL` de fixture | `TEST_FIXTURE` | `backend/tests/setup.ts` | mantener en test |
| JWT/Stripe fixtures | `TEST_FIXTURE` | `backend/tests/setup.ts` | no son secretos reales |
| puerto, límites y rate limit | `ENV`/`CONSTANTE_APP` | `src/config/env.ts` | 5D |
| `GTQ` y minor units | `REGLA_DOMINIO` | `stripe.service.ts` | decisión, no mover automáticamente |
| IVA 12 fallback | `REGLA_DOMINIO` | módulo configuraciones/facturas | 5D + negocio |
| estados de reservas/pagos/carrito | `CONSTANTE_APP`/regla | modelos/services/tests | 5D |
| localhost en test/CORS | `TEST_FIXTURE` | tests y compose | mantener aislado |
| URLs, regiones o buckets | `REQUIERE_ANALISIS` | no se concluye sólo por literal | 5D |

No convertir todos los literales en variables de entorno. No se encontraron
secretos productivos versionados durante la inspección.
