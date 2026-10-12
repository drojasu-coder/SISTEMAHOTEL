import { z } from "zod";

const fechaSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "La fecha debe tener formato YYYY-MM-DD"
  );

const horaSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "La hora debe tener formato HH:mm"
  );

export const createTurnoSchema = z
  .object({
    empleado_id: z
      .number()
      .int()
      .positive(
        "El empleado debe ser válido"
      ),

    fecha: fechaSchema,

    hora_inicio: horaSchema,

    hora_fin: horaSchema,
  })
  .strict();

export const updateTurnoSchema = z
  .object({
    fecha:
      fechaSchema.optional(),

    hora_inicio:
      horaSchema.optional(),

    hora_fin:
      horaSchema.optional(),
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