# Riesgos y deuda técnica

- El backend completo no está modularizado; sólo existen dos pilotos.
- Swagger depende de routers legacy como fuente de documentación y requiere disciplina al añadir módulos.
- El análisis de ciclos cubre imports relativos resolubles, no todos los aliases ni cargas dinámicas.
- Las fachadas públicas no pueden retirarse sin conocer consumidores externos.
- La cobertura global no garantiza cobertura de cada contrato o regla crítica.
- La referencia local de José no se actualizó con `fetch`.
- Vulnerabilidades transitivas conocidas de `uuid` permanecen por compatibilidad con Sequelize 6.
- Paginación, filtros, fechas, archivos/S3 y DTOs necesitan decisiones de contrato para frontend.
- Reservas, pagos, facturación, carritos, reembolsos y Stripe concentran riesgo y requieren integración separada.

Ninguno de estos puntos justifica cambios productivos especulativos en 3E. Deben convertirse en tareas específicas con pruebas y autorización.
