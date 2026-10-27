import { z } from "zod";

const fecha = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "La fecha debe tener el formato AAAA-MM-DD"
  )
  .refine((value) => {
    const parsedDate =
      new Date(`${value}T00:00:00Z`);

    return (
      !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.toISOString().slice(0, 10) === value
    );
  }, "La fecha no es válida");

export const disponibilidadHabitacionSchema =
  z
    .object({
      sucursal_id: z.coerce.number().int().positive(),
      fecha_entrada: fecha,
      fecha_salida: fecha,
      numero_huespedes: z.coerce.number().int().positive(),
      tipo_habitacion_id: z.coerce.number().int().positive().optional(),
    })
    .strict();
