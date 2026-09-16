import { z } from "zod";

const estadosHabitacion = [
  "disponible",
  "ocupada",
  "mantenimiento",
  "limpieza",
] as const;

const habitacionFields = {
  sucursal_id: z
    .number()
    .int("El ID de la sucursal debe ser un número entero")
    .positive("El ID de la sucursal debe ser positivo"),

  tipo_habitacion_id: z
    .number()
    .int("El ID del tipo de habitación debe ser un número entero")
    .positive("El ID del tipo de habitación debe ser positivo"),

  numero: z
    .string()
    .trim()
    .min(1, "El número de habitación es obligatorio")
    .max(10, "El número de habitación no puede superar 10 caracteres"),

  estado: z
    .enum(estadosHabitacion, {
      errorMap: () => ({
        message:
          "El estado debe ser disponible, ocupada, mantenimiento o limpieza",
      }),
    })
    .optional(),
};

export const createHabitacionSchema = z
  .object(habitacionFields)
  .strict();

export const updateHabitacionSchema = z
  .object(habitacionFields)
  .partial()
  .strict();

export const habitacionIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "El ID debe contener únicamente dígitos")
    .transform(Number)
    .refine((id) => id > 0, "El ID debe ser un número positivo"),
}).strict();