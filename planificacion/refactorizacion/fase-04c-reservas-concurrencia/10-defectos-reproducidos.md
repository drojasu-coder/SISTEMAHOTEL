# Defectos reproducidos

No se reprodujo un defecto productivo mediante una prueba ejecutada en esta fase.

## Riesgos confirmados por inspección, no defectos reproducidos

| Severidad propuesta | Área | Evidencia | Condición |
|---|---|---|---|
| Alta | Actividad | SELECT de solapamiento seguido de INSERT sin transacción | dos solicitudes concurrentes para el mismo recurso/instructor |
| Alta | Mesa | SELECT de disponibilidad seguido de INSERT sin transacción | dos solicitudes para misma mesa, fecha y hora |
| Alta | Parqueo | SELECT de intervalo seguido de INSERT sin transacción | dos intervalos concurrentes para mismo parqueo |
| Alta | Spa | SELECT de terapeuta/solapamiento seguido de INSERT sin transacción | dos citas concurrentes en la ventana de buffer |
| Media | Eventos | cálculo de “hoy” con zona local del proceso, no `APP_TIMEZONE` | servidor con zona distinta a la del hotel |
| Media | Spa | no se observó validación temporal equivalente a otros dominios | fecha/hora pasada aceptada si validator no la bloquea |

Estos hallazgos requieren pruebas aisladas y decisión funcional antes de corregir. No se les asigna estado “defecto reproducido”.
