import { z } from "zod";

import { moneySchema } from "../common.validator";

export const createSalonSchema = z
  .object({
    sucursal_id: z
      .number()
      .int()
      .positive("La sucursal debe ser válida"),

    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre no puede superar 100 caracteres"),

    capacidad_maxima: z
      .number()
      .int()
      .positive("La capacidad máxima debe ser mayor que cero"),

    tarifa_base: moneySchema.refine(
      (value) => value > 0,
      {
        message: "La tarifa base debe ser mayor que cero",
      }
    ),

    descripcion: z
      .string()
      .trim()
      .max(1000, "La descripción es demasiado larga")
      .optional()
      .nullable(),
  })
  .strict();

export const updateSalonSchema = z
  .object({
    sucursal_id: z
      .number()
      .int()
      .positive("La sucursal debe ser válida")
      .optional(),

    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100)
      .optional(),

    capacidad_maxima: z
      .number()
      .int()
      .positive("La capacidad máxima debe ser mayor que cero")
      .optional(),

    tarifa_base: moneySchema
      .refine((value) => value > 0, {
        message: "La tarifa base debe ser mayor que cero",
      })
      .optional(),

    descripcion: z
      .string()
      .trim()
      .max(1000)
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Debe enviar al menos un campo para actualizar",
    }
  );