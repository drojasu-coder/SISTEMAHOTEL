import {
  z,
} from "zod";

const timeSlotRegex =
  /^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d$/;

const fecha = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "La fecha debe tener formato YYYY-MM-DD"
  )
  .refine(
    (value) => {
      const [
        year,
        month,
        day,
      ] = value
        .split("-")
        .map(Number);

      const parsedDate =
        new Date(
          Date.UTC(
            year,
            month - 1,
            day
          )
        );

      return (
        parsedDate.getUTCFullYear() ===
          year &&
        parsedDate.getUTCMonth() ===
          month - 1 &&
        parsedDate.getUTCDate() ===
          day
      );
    },
    "La fecha no es válida"
  );

export const createReservaAmenidadSchema =
  z
    .object({
      amenidad_id: z
        .number()
        .int(
          "El ID de la amenidad debe ser un número entero"
        )
        .positive(
          "El ID de la amenidad debe ser positivo"
        ),

      fecha,

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
  z
    .object({
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