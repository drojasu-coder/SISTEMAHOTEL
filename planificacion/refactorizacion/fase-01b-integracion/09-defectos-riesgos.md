# Fase 1B — Defectos y riesgos

## Observados

1. El modelo de mesa exige `zona`; los fixtures deben respetar el esquema real.
2. `sequelize-cli` no toma automáticamente `DATABASE_URL` desde la configuración
   actual; las migraciones requieren URL explícita.
3. La cobertura de ramas es baja (10.46%) y no representa validación exhaustiva.
4. La configuración de Vitest emite advertencia por ESM dentro de un paquete
   CommonJS.

## Riesgos pendientes

- Concurrencia real y bloqueos de reservas aún no caracterizados.
- Reembolsos, rollback e idempotencia de webhooks aún incompletos.
- Igualdad de esquemas, permisos y códigos HTTP contra OpenAPI aún no certificada.
- El volumen de prueba debe mantenerse separado y no eliminarse sin autorización.

No se corrigieron defectos funcionales automáticamente.
