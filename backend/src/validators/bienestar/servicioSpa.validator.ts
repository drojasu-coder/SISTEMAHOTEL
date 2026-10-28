import { z } from "zod";

// NULL = servicio general (registros anteriores a la vinculación por sede).
const sucursalId = z.number().int().positive("La sucursal debe ser válida").nullable();

export const listServiciosSpaQuerySchema = z
  .object({
    sucursal_id: z.coerce.number().int().positive().optional(),
    incluir_inactivos: z.enum(["true", "false"]).optional(),
  })
  .strict();

export const createServicioSpaSchema =
  z.object({
    nombre: z
      .string()
      .trim()
      .min(
        1,
        "El nombre es obligatorio"
      )
      .max(100),

    duracion_minutos: z
      .number()
      .int()
      .positive(
        "La duración debe ser mayor a 0 minutos"
      ),

    precio: z
      .number()
      .positive(
        "El precio debe ser mayor a 0"
      ),

    sucursal_id: sucursalId.optional(),

    activo: z.boolean().optional(),
  })
  .strict();

export const updateServicioSpaSchema =
  z.object({
    nombre: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .optional(),

    duracion_minutos: z
      .number()
      .int()
      .positive()
      .optional(),

    precio: z
      .number()
      .positive()
      .optional(),

    sucursal_id: sucursalId.optional(),

    activo: z.boolean().optional(),
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