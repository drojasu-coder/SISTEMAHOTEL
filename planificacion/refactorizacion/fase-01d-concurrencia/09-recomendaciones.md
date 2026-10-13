# Fase 1D — Recomendaciones para otros módulos

Antes de copiar este patrón a parqueo, mesa, actividad o amenidad se debe verificar:

1. cuál es la fila física que representa el recurso;
2. qué estados bloquean disponibilidad;
3. si el intervalo es fecha/hora exacto o rango;
4. si existe una sola fila o varias filas que deben bloquearse en orden estable;
5. qué códigos HTTP y errores ya forman parte del contrato.

No se recomienda añadir una transacción genérica sin caracterizar esos puntos. Para
garantía de base de datos a largo plazo debe evaluarse una migración nueva con
restricciones de exclusión, previa autorización.
