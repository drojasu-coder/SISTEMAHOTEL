# Arquitectura de errores implementada

Se conserva una sola clase `AppError`. Su constructor mantiene la firma
existente y acepta opcionalmente `cause` para conservar contexto interno sin
devolverlo al cliente.

El handler devuelve la estructura existente:

```json
{
  "success": false,
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Los datos enviados no son válidos",
  "details": [{ "field": "email", "message": "..." }]
}
```

Los errores inesperados responden con `INTERNAL_SERVER_ERROR`. El registro
seguro solo incluye metodo, URL, codigo, status y tipo de error; no incluye
mensaje, SQL, stack, tokens ni credenciales.
