# Riesgos y bloqueos

- Falta la lista verificable de las 36 operaciones.
- La referencia local puede no reflejar cambios futuros de José.
- Reservas, pagos, carritos y facturación tienen riesgo funcional alto.
- Cinco endpoints fueron resueltos por inspección, pero carecen de pruebas específicas.
- Cambios en modelos/migraciones o configuración pueden afectar todos los lotes.
- OpenAPI depende de routers legacy y debe revisarse tras cualquier cambio de rutas.

Bloqueo actual: no iniciar trabajo funcional de José hasta autorización explícita y confirmación de la base. No se requiere corregir código en esta fase.
