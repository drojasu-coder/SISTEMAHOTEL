# Reservas consolidadas

| Dominio | Evidencia | Clasificación |
|---|---|---|
| Habitaciones | transacciones, locks y pruebas concurrentes existentes | comprobado |
| Amenidades | servicio revisado; cobertura específica insuficiente | riesgo técnico/falta de cobertura |
| Eventos | transacciones observadas; evidencia funcional incompleta | riesgo |
| Transporte | transacciones observadas; evidencia incompleta | riesgo |
| Actividades | patrón `SELECT` seguido de escritura sin protección equivalente | riesgo técnico |
| Mesas | patrón `SELECT` seguido de escritura sin protección equivalente | riesgo técnico |
| Parqueos | patrón `SELECT` seguido de escritura sin protección equivalente | riesgo técnico |
| Spa | patrón `SELECT` seguido de escritura sin protección equivalente | riesgo técnico |

Los cuatro últimos casos no se declaran bugs automáticamente. Pueden ser
pendiente técnico, regla futura de José o decisión de negocio según evidencia
adicional. No se añadieron reglas ni pruebas cuyo resultado dependiera de una
política inventada.
