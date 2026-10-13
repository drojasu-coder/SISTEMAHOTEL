# 03 — Pruebas de reservas

## Implementadas y ejecutadas

Se agregaron pruebas unitarias de validadores para:

- Reserva de habitación válida.
- Fecha imposible y campo desconocido en reserva de mesa.
- Horario inválido en reserva de actividad.

Resultado: **3 casos de reserva, 3 exitosos**.

## Casos aún no ejecutados

Creación real, fecha pasada, rango invertido, traslapes, intervalos adyacentes, recurso inexistente/no disponible, usuario inexistente, ownership, actualización, cancelación, transición de estado, disponibilidad posterior y concurrencia.

## Motivo del bloqueo

Estos casos llaman servicios y modelos Sequelize. No se ejecutaron contra la base de desarrollo ni se usó `sync({force:true})`. Requieren levantar `backend/docker-compose.test.yml`, verificar explícitamente la URL de `hotel_test_db`, aplicar migraciones en esa base y preparar fixtures aislados.

## Distinción de resultados

- **Actual observado:** los validators aceptan/rechazan los casos unitarios indicados.
- **Documentado:** las reglas descritas en los validators/services.
- **Esperado:** disponibilidad/concurrencia según requisitos.
- **Defecto confirmado:** ninguno en los casos ejecutados; no se infiere corrección de los casos bloqueados.
