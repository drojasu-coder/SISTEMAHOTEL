# Preparación de la siguiente fase

La siguiente fase debe comenzar con la matriz de José y priorizar reservas auxiliares, pagos/facturación y carritos según impacto. Antes de cualquier corrección funcional:

1. confirmar reglas y estados con responsables;
2. convertir los `UNKNOWN` y `requires trace` prioritarios en trazabilidad manual;
3. añadir pruebas PostgreSQL/HTTP aisladas;
4. actualizar OpenAPI sólo si el contrato vigente lo requiere y con autorización;
5. revisar la referencia Git actualizada;
6. integrar en lotes pequeños y repetir la suite.

No se inicia Fase 4B-2 ni se aplican correcciones funcionales automáticamente.
