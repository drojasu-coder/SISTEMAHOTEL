# Rate limiting

`express-rate-limit` protege `/api/auth/login` y `/api/auth/register`.
El limite es configurable con:

- `RATE_LIMIT_WINDOW_MS` (por defecto 60 segundos).
- `AUTH_RATE_LIMIT_MAX` (por defecto 10 solicitudes por ventana y por IP).

La respuesta es 429 con el contrato existente:

```json
{
  "success": false,
  "statusCode": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Demasiadas solicitudes. Inténtelo nuevamente más tarde"
}
```

El almacenamiento es memoria local. No es suficiente para coordinar múltiples
instancias; producción distribuida deberá usar un store compartido.
`TRUST_PROXY` es numérico y por defecto 0; no se habilita indiscriminadamente.
