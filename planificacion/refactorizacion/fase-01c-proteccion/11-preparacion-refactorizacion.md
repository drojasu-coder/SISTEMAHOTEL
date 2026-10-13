# Fase 1C — Preparación para refactorización

## Suficientemente caracterizado

- autenticación básica, credenciales, roles insuficientes, usuario inactivo y JWT
  inválido/expirado;
- reglas secuenciales actuales de habitación, mesa y actividad;
- aislamiento de PostgreSQL y limpieza limitada de nuevos fixtures;
- firma Stripe local sin red.

## Bloqueado o incompleto

- concurrencia de reservas de habitación: defecto reproducible;
- concurrencia de parqueo, mesa, actividad y amenidad;
- cancelaciones, actualizaciones, estados inactivos y ownership exhaustivos;
- carrito expirado, artículos, transferencias, reembolsos y rollback;
- replay/eventos fuera de orden de Stripe;
- comparación detallada de esquemas y respuestas contra OpenAPI.

No se autoriza Fase 2 para reservas ni pagos. Sólo podrían considerarse cambios internos
en módulos no afectados, después de una ejecución completa y revisión explícita.
