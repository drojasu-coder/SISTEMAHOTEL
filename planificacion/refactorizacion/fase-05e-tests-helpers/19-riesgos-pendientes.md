# Riesgos y pendientes

- Las fixtures de integración crecerán si se agregan dominios; extraer
  factories sólo ante duplicación real.
- La limpieza por suite debe seguir respetando foreign keys.
- `Date.now()` se usa para evitar colisiones en datos sintéticos; no afecta
  asserts de negocio, pero puede revisarse si aparece flakiness.
- El warning de configuración CommonJS/ESM de Vitest es preexistente.
