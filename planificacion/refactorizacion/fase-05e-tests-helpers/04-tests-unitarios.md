# Tests unitarios

Las nueve suites unitarias cubren validación de entorno, autenticación,
errores, logging/redaction, Stripe, OpenAPI, arquitectura, ownership y
validadores.

`error-handling.test.ts` reutiliza localmente un constructor de response porque
prueba middleware sin servidor HTTP. `logger.test.ts` usa un único spy de
console con restauración por test. Estos patrones son específicos de sus
capas y no constituyen duplicación eliminable.

No se modificaron nombres, asserts ni setup.
