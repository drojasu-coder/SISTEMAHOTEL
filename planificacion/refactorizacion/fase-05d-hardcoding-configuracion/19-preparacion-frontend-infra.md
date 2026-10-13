# Preparación frontend e infraestructura

El backend queda preparado para recibir configuración por entorno sin
introducir variables especulativas.

Para una futura aplicación React, la variable probable es
`VITE_API_BASE_URL`. No se creó ni se modificó `.env` del frontend.

No se añadieron variables AWS (`S3`, región o credenciales) porque no existe
implementación AWS real en el backend actual.
