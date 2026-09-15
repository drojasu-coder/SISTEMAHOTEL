import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export const createCitaSpaSchema =
  z.object({
    terapeuta_id: z
      .number()
      .int()
      .positive(
        "El ID del terapeuta es obligatorio"
      ),

    servicio_bienestar_id: z
      .number()
      .int()
      .positive(
        "El ID del servicio de bienestar es obligatorio"
      ),

    fecha: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "La fecha debe ser YYYY-MM-DD"
      ),

    hora_inicio: z
      .string()
      .regex(
        timeRegex,
        "Formato de hora inválido (HH:MM)"
      ),
  })
  .strict();

export const updateCitaSpaSchema = z
  .object({
    estado: z.string().max(20).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });