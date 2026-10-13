# Helmet y cabeceras

Se habilito Helmet globalmente:

- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: no-referrer`.
- Protecciones adicionales de Helmet.
- `X-Powered-By` deshabilitado.

Content Security Policy y Cross-Origin Embedder Policy se deshabilitaron
deliberadamente para no romper Swagger UI, que se sirve desde
`/api/docs`. HSTS solo se activa en produccion, evitando forzar HTTPS local.
