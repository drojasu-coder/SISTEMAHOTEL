# Horarios de reserva: procedimiento para producción

Pendiente de ejecutar. Aplicado y verificado solo en PostgreSQL local (`hotel_db`).

## 1. Respaldo y estado
```bash
cd backend
npx sequelize-cli db:migrate:status      # deben figurar como "down" las dos migraciones siguientes
```
Respalde la base antes de continuar.

## 2. Migraciones (aditivas y reversibles)
- `20261029010000-horarios-operacion-servicios.js`: `hora_apertura` y `hora_cierre` en `servicios_bienestar`, `amenidades` y `recursos_actividad`; `duracion_minutos` en `amenidades`.
- `20261029020000-horario-salones.js`: `hora_apertura` y `hora_cierre` en `salones`.

```bash
npx sequelize-cli db:migrate
```

## 3. Inicialización idempotente
Completa solo campos vacíos con los horarios iniciales de la presentación (no son horarios comerciales confirmados):

| Módulo | Horario | Otros |
|---|---|---|
| Bienestar y spa | 09:00–18:00 | — |
| Amenidades reservables | 08:00–20:00 | 60 min si no tienen duración |
| Actividades y experiencias | 08:00–18:00 | — |
| Salones | 08:00–22:00 | — |

No modifica horarios ni duraciones ya configurados, amenidades de libre acceso, reservas, cupos, tarifas, modalidades ni pagos.

```bash
npx ts-node scripts/inicializar-horarios.ts           # simulación: revisar totales y excepciones
npx ts-node scripts/inicializar-horarios.ts --apply   # aplica en una transacción
npx ts-node scripts/inicializar-horarios.ts --apply   # repetir: debe asignar 0 (idempotente)
```

## 4. Después
- Despliegue el backend y el frontend que incluyen estos cambios.
- Ajuste los horarios reales desde el panel (Bienestar, Amenidades, Recursos de actividad, Salones). Las reservas existentes no se modifican; el panel avisa cuántas quedan fuera de un horario nuevo.
- Reversión: `npx sequelize-cli db:migrate:undo` (dos veces) elimina las columnas y los horarios.
