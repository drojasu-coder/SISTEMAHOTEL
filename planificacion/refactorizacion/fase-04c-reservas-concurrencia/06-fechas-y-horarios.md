# Fechas y horarios

| Área | Comportamiento observado | Riesgo |
|---|---|---|
| Habitaciones | fechas `YYYY-MM-DD`, hoy se obtiene con `APP_TIMEZONE`, noches con UTC explícito | relativamente consistente; probar cambio de día cerca de medianoche |
| Amenidades | fecha calendario y hora actual en `APP_TIMEZONE`; slots `HH:MM-HH:MM`, fin exclusivo | depende de strings normalizados; sin prueba de frontera |
| Actividades | fecha/hora actual en `APP_TIMEZONE`; duración 30–120 min | comparación lexicográfica válida sólo con formato normalizado |
| Mesas | fecha/hora en `APP_TIMEZONE`; slot puntual | igualdad de hora, no intervalo |
| Parqueos | `YYYY-MM-DD` permite el día actual; fecha con hora usa `Date`/`Date.now()` | mezcla fecha local y instante absoluto |
| Eventos | usa `new Date(\`${fecha}T00:00:00\`)` y `Date.setHours`, no `APP_TIMEZONE` | inconsistencia real con habitaciones/amenidades |
| Spa | almacena/calcula horas y duración; no se observó validación temporal equivalente | fecha pasada y formato requieren confirmación/prueba |
| Transporte | `new Date` y `Date.now`, ventana en milisegundos | depende del offset incluido en el input |

No se modificó el modelo temporal. La normalización transversal de zona horaria y límites debe tratarse como decisión de negocio/arquitectura posterior.

Casos pendientes: igualdad exacta en inicio/fin, reservas consecutivas por dominio, DST, entradas sin offset, medianoche y `Date` inválidas en cada endpoint.
