import { z } from "zod";

const licenciaSchema = z
  .string()
  .trim()
  .min(
    1,
    "La licencia no puede estar vacía"
  )
  .max(
    50,
    "La licencia no puede superar 50 caracteres"
  );

export const createChoferSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(
        2,
        "El nombre debe tener al menos 2 caracteres"
      )
      .max(
        150,
        "El nombre no puede superar 150 caracteres"
      ),

    licencia: licenciaSchema
      .nullable()
      .optional(),
  })
  .strict();

export const updateChoferSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(
        2,
        "El nombre debe tener al menos 2 caracteres"
      )
      .max(150)
      .optional(),

    licencia: licenciaSchema
      .nullable()
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

export const updateChoferEstadoSchema = z
  .object({
    activo: z.boolean(),
  })
  .strict();