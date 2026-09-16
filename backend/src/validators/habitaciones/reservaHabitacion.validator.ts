import { z } from "zod";

const estadosReserva = [
  "pendiente",
  "confirmada",
  "cancelada",
  "finalizada",
  "expirada",
] as const;

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato AAAA-MM-DD")
  .refine((value) => {
    const parsedDate = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.toISOString().slice(0, 10) === value;
  }, "La fecha no es válida");

const reservaFields = {
  usuario_id: z.number().int().positive(),
  habitacion_id: z.number().int().positive(),
  fecha_entrada: fecha,
  fecha_salida: fecha,
  numero_huespedes: z.number().int().positive(),
  estado: z.enum(estadosReserva).optional(),
};

export const createReservaHabitacionSchema = z
  .object({
    usuario_id: reservaFields.usuario_id,
    habitacion_id: reservaFields.habitacion_id,
    fecha_entrada: reservaFields.fecha_entrada,
    fecha_salida: reservaFields.fecha_salida,
    numero_huespedes: reservaFields.numero_huespedes,
  })
  .strict();

export const updateReservaHabitacionSchema = z
  .object(reservaFields)
  .partial()
  .strict();

export const reservaHabitacionIdSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d+$/, "El ID debe contener únicamente dígitos")
      .transform(Number)
      .refine((id) => id > 0, "El ID debe ser un número positivo"),
  })
  .strict();
