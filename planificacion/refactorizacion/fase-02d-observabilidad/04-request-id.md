# Request ID

Cada solicitud recibe un UUID generado localmente y se devuelve en `X-Request-ID`. No se aceptan IDs enviados por clientes ni por `X-Forwarded-*`; así se evita que un actor externo falsifique correlación. El ID se incluye en logs HTTP, errores y eventos Stripe.

No se usa `AsyncLocalStorage`: los puntos de logging actuales reciben explícitamente el ID y no requieren contexto asíncrono global.

