# Seguridad y proteccion de informacion

Los mensajes SQL, contrasenas, tokens y claves no forman parte de respuestas
para clientes. Los errores inesperados usan mensaje generico. El logger global
no imprime mensaje ni stack.

Los errores de JWT mantienen sus contratos:

- Ausente: 401 `AUTH_TOKEN_REQUIRED`.
- Formato: 401 `INVALID_AUTH_FORMAT`.
- Expirado: 401 `TOKEN_EXPIRED`.
- Invalido: 401 `INVALID_TOKEN`.
- Usuario inactivo: 403 `USER_INACTIVE`.
- Rol invalido: 403 `INVALID_USER_ROLE`.

No se modificaron las reglas de autenticacion, ownership o autorizacion.
