# Riesgos y compatibilidad

- Los clientes reciben los mismos codigos y mensajes de negocio existentes.
- El nuevo mapeo de deadlock y lock timeout puede cambiar un 500 previo a 503
  solo para esos codigos PostgreSQL especificos.
- El logging pierde stack para evitar filtraciones; el diagnostico debe usar
  observabilidad segura fuera de la respuesta HTTP.
- La advertencia previa de Vitest sobre CommonJS/ESM permanece.
- No se agrego rate limiting; 429 queda como recomendacion.
- La correccion de concurrencia de reservas no fue modificada.
