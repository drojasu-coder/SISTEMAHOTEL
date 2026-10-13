# Mocks y spies

Sólo se detectó un spy explícito: `vi.spyOn(console, "log")` en
`logger.test.ts`, restaurado con `afterEach`.

No se mockea PostgreSQL ni servicios de dominio en las pruebas de persistencia.
Stripe no realiza llamadas reales: la prueba usa firma HMAC local y el
servicio se configura con credenciales sintéticas de test.

No se detectaron mocks innecesarios u ocultadores de comportamiento.
