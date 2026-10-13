# Middleware y validaciones Zod

`validateBody`, `validateParams` y `validateQuery` comparten ahora una funcion
para convertir `ZodIssue[]` a detalles por campo. Se conservan el codigo
`VALIDATION_ERROR`, status 400, mensajes publicos y reglas de cada esquema.

Se conserva el tratamiento especial para campos no reconocidos y tipos
invalidos. Los paths anidados se representan con puntos, por ejemplo
`cliente.email`, para consumo futuro del frontend.

El error handler delega al siguiente middleware cuando la respuesta ya envio
headers, evitando respuestas duplicadas.
