# 06 — Riesgos y estrategia de pruebas

## Registro de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación | Evidencia de salida |
|---|---:|---:|---|---|
| Cambio accidental de respuesta | Alta | Crítico | Snapshots por endpoint y compatibilidad de envelope | Diff de respuestas vacío o cambio versionado |
| Reserva doble bajo concurrencia | Media | Crítico | PostgreSQL real, transacción/lock y dos solicitudes simultáneas | Una sola reserva válida |
| Doble cobro/reembolso | Media | Crítico | Idempotencia, replay de webhook y locks | Una operación contable por clave |
| Bypass de ownership/rol | Media | Crítico | Matriz 401/403 con usuarios cliente/admin/gestión | Ningún caso cruzado autorizado |
| Ruptura del webhook raw | Media | Crítico | Test con firma real/fake válida sobre bytes exactos | 200 solo con evento válido |
| Migración destructiva | Baja | Crítico | No modificar histórico; ejecutar `db:migrate` en copia | Esquema antes/después y rollback documentado |
| Divergencia OpenAPI-código | Alta | Alto | Generación/verificación de matriz desde routers y docs | Sin rutas faltantes |
| Incompatibilidad de configuración | Alta | Alto | Validación de env y guía por ambiente | Arranque local/CI reproducible |
| Efecto N+1/rendimiento | Media | Alto | Logs de SQL y benchmark antes/después | Umbral acordado por listado |
| Fixtures contaminan datos | Media | Alto | Seeders separados por ambiente y base desechable | Ningún seeder de prueba sobre datos existentes |

## Pruebas mínimas por capa

1. **Contrato HTTP:** método, ruta, params, body, status, envelope, headers y serialización de error.
2. **Middleware:** ausencia/token inválido/expirado, usuario inactivo, rol inválido y rol insuficiente.
3. **Validación:** campos desconocidos, tipos, fechas/horas, montos y query inválida.
4. **Dominio:** disponibilidad, traslapes, estados, ownership, expiración del carrito y reglas de pago.
5. **Persistencia:** FK, unique, rollback de transacción y asociaciones.
6. **Integración Stripe:** firma, raw body, Payment Intent, transferencia, reembolso e idempotencia.
7. **Regresión:** ejecutar la matriz de endpoints críticos contra baseline antes de cada extracción.

## Casos críticos de reservas

- Fecha pasada, fecha fin anterior/inclusiva, misma hora frontera y duración mínima/máxima.
- Dos usuarios intentando el mismo recurso simultáneamente.
- Reserva cancelada que libera o no libera disponibilidad según regla actual.
- Usuario intentando leer/modificar la reserva de otro usuario.
- Estado no permitido y transición repetida.
- FK inexistente y recurso inactivo.

## Casos críticos de pagos

- Exactamente uno de `carrito_id`/`reserva_habitacion_id`; ninguno y ambos deben fallar.
- Monto cero, negativo, más de dos decimales y discrepancia con el origen.
- Repetición de `idempotency_key`.
- Webhook duplicado, firma inválida, evento desconocido y evento fuera de orden.
- Reembolso total/parcial, saldo insuficiente y reembolso repetido.

## Criterios de bloqueo

No promover una fase si falla una ruta existente, cambia un código/mensaje sin decisión documentada, hay un caso de doble reserva/cobro, el webhook no verifica bytes raw o una migración modifica datos sin aprobación.
