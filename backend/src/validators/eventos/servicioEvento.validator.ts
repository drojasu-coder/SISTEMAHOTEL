import { z } from "zod";

import { moneySchema } from "../common.validator";

export const createServicioEventoSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(
        2,
        "El nombre debe tener al menos 2 caracteres"
      )
      .max(
        100,
        "El nombre no puede superar 100 caracteres"
      ),

    precio: moneySchema,
  })
  .strict();

export const updateServicioEventoSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(
        2,
        "El nombre debe tener al menos 2 caracteres"
      )
      .max(
        100,
        "El nombre no puede superar 100 caracteres"
      )
      .optional(),

    precio: moneySchema.optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message:
        "Debe enviar al menos un campo para actualizar",
    }
  );