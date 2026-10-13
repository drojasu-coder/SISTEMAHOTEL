# Arquitectura de observabilidad

El flujo es: request ID -> Helmet/CORS/parsers/rutas -> error handler -> access log al finalizar la respuesta. El logger escribe a stdout/stderr, apropiado para contenedores y recolectores externos.

La implementación es interna y deliberadamente pequeña; no añade Pino, Redis, Prometheus ni OpenTelemetry. La agregación, métricas y almacenamiento distribuido quedan para una fase posterior.

