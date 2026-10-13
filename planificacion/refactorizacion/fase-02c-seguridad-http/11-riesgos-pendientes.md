# Riesgos pendientes

- Rate limiting en memoria no coordina múltiples instancias.
- `TRUST_PROXY` debe configurarse según la topologia real del reverse proxy.
- CSP queda deshabilitada para compatibilidad con Swagger; debe revisarse si
  Swagger se publica en una superficie no confiable.
- No se implementó rate limiting distribuido ni autenticacion adicional para
  proveedores externos.
- No se alteraron rutas aparentemente publicas porque eso requeriria revisar
  contratos y autorizacion funcional.
