# Riesgos pendientes

El logger no tiene almacenamiento distribuido ni backpressure propio; depende del recolector stdout del entorno. `SLOW_QUERY_THRESHOLD_MS` aún no mide consultas. Los contadores de rate limit siguen siendo en memoria y quedan documentados desde Fase 2C.

La redacción basada en nombres de claves no sustituye clasificación formal de datos. Debe revisarse cualquier nuevo campo antes de incorporarlo a logs. Permanecen las cinco alertas npm documentadas en Fase 2C-S; esta fase no actualizó dependencias.

