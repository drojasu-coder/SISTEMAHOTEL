import { z } from "zod";

import { moneySchema } from "../common.validator";

const tipoHabitacionFields = {
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre del tipo de habitación es obligatorio")
    .max(50, "El nombre no puede superar 50 caracteres"),

  capacidad_maxima: z
    .number()
    .int("La capacidad máxima debe ser un número entero")
    .positive("La capacidad máxima debe ser positiva"),

  tarifa_noche: moneySchema,

  descripcion: z
    .string()
    .trim()
    .max(500, "La descripción no puede superar 500 caracteres")
    .nullable()
    .optional(),
};

export const createTipoHabitacionSchema = z
  .object(tipoHabitacionFields)
  .strict();

export const updateTipoHabitacionSchema = z
  .object(tipoHabitacionFields)
  .partial()
  .strict();

export const tipoHabitacionIdSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d+$/, "El ID debe contener únicamente dígitos")
      .transform(Number)
      .refine((id) => id > 0, "El ID debe ser un número positivo"),
  })
  .strict();
