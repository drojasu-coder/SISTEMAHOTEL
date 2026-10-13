# Logging HTTP

Al terminar cada respuesta se registra `http.request` con request ID, método, ruta sin query, status y duración en milisegundos. Las rutas numéricas y UUID se normalizan a `:id`; no se registran cuerpos, query strings ni cabeceras.

Los errores esperados usan `warn`; fallos 5xx usan `error`. El access log no altera la respuesta.

