# Errores y diagnósticos

El middleware central mantiene los contratos HTTP de Fase 2B. Registra código interno, tipo, status, método, ruta y request ID. Los errores inesperados conservan diagnóstico interno saneado, sin enviarlo al cliente.

Deadlocks, lock timeouts, fallos de conexión, validaciones y errores de autenticación conservan sus códigos existentes y su severidad apropiada.

