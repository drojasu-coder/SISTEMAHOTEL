# Seguridad y redacción

Se redaccionan claves que contengan authorization, cookie, password, secret, token, signature, API key, client secret, card o CVV. También se sanea texto de mensajes y stacks de errores con esos indicadores.

Nunca se registran cuerpos completos, URLs con query, credenciales, JWT, cookies, claves Stripe o payloads Stripe. Los logs deben seguir considerándose internos y con acceso restringido.

