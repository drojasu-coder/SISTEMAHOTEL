import { z } from "zod";

const sucursalId = z.number().int().positive("La sucursal debe ser válida").nullable();

export const listTerapeutasQuerySchema = z
  .object({
    sucursal_id: z.coerce.number().int().positive().optional(),
  })
  .strict();

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

    sucursal_id: sucursalId.optional(),
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

    sucursal_id: sucursalId.optional(),
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