# 07 — Hallazgos y bloqueos

## Hallazgos confirmados

1. Los 184 contratos documentados coinciden en cantidad con 182 routers más health y webhook; esto no demuestra que schemas, permisos y respuestas sean idénticos.
2. Existen dos envelopes de éxito.
3. La infraestructura actual permite importar `app` sin abrir puerto.
4. La configuración productiva y de desarrollo usa credenciales literales en `config.json`; no se modificó en esta fase.
5. No existe suite previa; esta fase agrega una línea base inicial, no cobertura completa.
6. El validator de creación de pago acepta ambos campos de origen a nivel de schema; la regla de origen exclusivo se aplica posteriormente en servicio/consulta de resumen y requiere prueba de integración.

## Bloqueos

- PostgreSQL aislado aún no iniciado ni migrado.
- No hay fixtures de usuarios/reservas/carritos para pruebas HTTP completas.
- No se ejecutaron concurrencia, locks, rollback ni webhooks válidos.
- No se compararon exhaustivamente schemas de respuesta de cada operación.
- No se ejecutó una prueba contra Stripe, incluso en test mode.

## No corregido intencionalmente

No se modificaron configuración productiva, validadores, servicios, controllers, rutas, modelos, migraciones ni datos. Los hallazgos se reservan para fases separadas.
