# Riesgos y compatibilidad

- Los entornos que no definan `DATABASE_URL` dejaran de arrancar de forma
  silenciosa; esto evita conexiones accidentales con valores embebidos.
- La CLI requiere las variables del ambiente seleccionado.
- Stripe sigue siendo opcional; al habilitarlo requiere ambas credenciales.
- No cambiaron contratos HTTP, migraciones historicas, tablas ni nombres de
  modelos.
- La advertencia existente de Vitest sobre CommonJS/ESM no forma parte de esta
  fase.
