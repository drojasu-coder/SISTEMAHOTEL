import { z } from "zod";

export const createTerapeutaSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(
        1,
        "El nombre es obligatorio"
      )
      .max(150),

    activo: z
      .boolean()
      .optional(),
  })
  .strict();

export const updateTerapeutaSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1)
      .max(150)
      .optional(),

    activo: z
      .boolean()
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      Object.keys(data).length > 0,
    {
      message:
        "Debe enviar al menos un campo para actualizar",
    }
  );