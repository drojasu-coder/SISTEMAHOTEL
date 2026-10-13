# Pruebas agregadas

No se añadieron archivos de prueba en Fase 4C. La decisión es deliberada:

1. La regresión crítica de habitaciones ya existe y cubre solapamiento, adyacencia, cancelación, rollback y concurrencia de dos/tres solicitudes.
2. Actividades y mesas ya tienen pruebas de conflicto deterministas.
3. Amenidades, eventos, parqueos, spa y transporte requieren fixtures adicionales y decisiones explícitas sobre estados, usuarios, sucursales y asignación.
4. Añadir una expectativa de “un único ganador” a dominios sin transacción convertiría un riesgo observado en una prueba fallida o congelaría una regla no aprobada.

Evidencia ejecutada:

- Suite completa: 65 pruebas exitosas.
- Unitarias: baseline exitoso.
- Integración: baseline exitoso, incluyendo PostgreSQL de reservas.
- Typecheck: exitoso.

Pruebas recomendadas, no implementadas: concurrencia de aforo de amenidades, doble asignación de transporte, reactivación conflictiva de eventos y frontera de buffer de spa.
