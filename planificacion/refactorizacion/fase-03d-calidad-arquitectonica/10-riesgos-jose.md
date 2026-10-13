# Riesgos de integración con José

La referencia local disponible es `origin/hardening/backend-final` en `83d0827`, fechado `2026-10-12 22:21:14 -0600`. No se ejecutó `fetch`, por lo que no puede certificarse que represente el remoto actual.

Matriz de posible conflicto:

| Archivo o área | Riesgo | Separación |
|---|---|---|
| `backend/src/app.ts` | Medio: composition root compartido | Esta fase sólo conserva imports de módulos |
| `backend/src/routes/*` | Bajo en módulos migrados | No se cambiaron contratos; adapters conservan routers |
| `backend/src/controllers` y `services` | Bajo | Sólo fachadas de compatibilidad existentes |
| Pagos, reservas, Stripe | Alto | No fueron modificados |

La integración debe comparar nuevamente ambos árboles antes de resolver conflictos.
