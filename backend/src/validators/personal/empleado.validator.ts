import { z } from "zod";
const additionalSites = z.array(z.number().int().positive()).max(50).refine(ids => new Set(ids).size === ids.length, "No repita sedes adicionales").optional();

const fechaSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "La fecha debe tener formato YYYY-MM-DD"
  );

export const createEmpleadoSchema = z
  .object({
    sedes_adicionales: additionalSites,
    usuario_id: z
      .number()
      .int()
      .positive(
        "El usuario debe ser válido"
      ),

    sucursal_id: z
      .number()
      .int()
      .positive(
        "La sucursal debe ser válida"
      ),

    area: z
      .string()
      .trim()
      .min(
        2,
        "El área debe tener al menos 2 caracteres"
      )
      .max(
        50,
        "El área no puede superar 50 caracteres"
      ),

    fecha_contratacion:
      fechaSchema
        .optional()
        .nullable(),
  })
  .strict();

export const updateEmpleadoSchema = z
  .object({
    sedes_adicionales: additionalSites,
    sucursal_id: z
      .number()
      .int()
      .positive(
        "La sucursal debe ser válida"
      )
      .optional(),

    area: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .optional(),

    fecha_contratacion:
      fechaSchema
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
