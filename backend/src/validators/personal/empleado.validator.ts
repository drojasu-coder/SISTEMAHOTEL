import { z } from "zod";
import { createUsuarioAdminSchema } from "../usuarios/usuario.validator";
import { ROLES } from "../../constants/roles";
const cuentaSchema = createUsuarioAdminSchema.extend({
  rol: z.enum([ROLES.GERENTE_HABITACIONES, ROLES.RECEPCIONISTA, ROLES.EMPLEADO_OPERATIVO, ROLES.GERENTE_RESTAURANTE]),
  activo: z.boolean().default(true),
});
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
    cuenta: cuentaSchema.optional(),
    usuario_id: z
      .number()
      .int()
      .positive(
        "El usuario debe ser válido"
      ).optional(),

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
  .strict()
  .refine(data => Boolean(data.usuario_id) !== Boolean(data.cuenta), { message: "Indique una cuenta nueva o un usuario existente, no ambos", path: ["usuario_id"] });

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
