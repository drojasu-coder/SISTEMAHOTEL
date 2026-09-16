import {
  z,
} from "zod";

const timeSlotRegex =
  /^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d$/;

export const createReservaAmenidadSchema =
  z.object({
    amenidad_id: z
      .number()
      .int()
      .positive(
        "El ID de la amenidad debe ser positivo"
      ),

    fecha: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "La fecha debe tener formato YYYY-MM-DD"
      ),

    franja_horaria: z
      .string()
      .trim()
      .regex(
        timeSlotRegex,
        "La franja horaria debe tener formato HH:MM-HH:MM"
      ),

    mobiliario: z
      .string()
      .trim()
      .min(
        1,
        "El mobiliario no puede estar vacío"
      )
      .max(
        30,
        "El mobiliario no puede superar 30 caracteres"
      )
      .optional()
      .nullable(),
  })
  .strict();

export const updateReservaAmenidadSchema =
  z.object({
    estado: z.enum(
      [
        "cancelada",
        "usada",
      ],
      {
        error:
          "El estado debe ser cancelada o usada",
      }
    ),
  })
  .strict();