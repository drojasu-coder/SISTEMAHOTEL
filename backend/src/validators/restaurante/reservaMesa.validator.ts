import { z } from "zod";

const timeRegex =
  /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

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
      ] =
        value
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

export const createReservaMesaSchema =
  z
    .object({
      mesa_id: z
        .number()
        .int(
          "El ID de la mesa debe ser un número entero"
        )
        .positive(
          "El ID de la mesa debe ser positivo"
        ),

      fecha,

      hora: z
        .string()
        .regex(
          timeRegex,
          "La hora debe tener formato HH:MM o HH:MM:SS"
        ),

      numero_comensales:
        z
          .number()
          .int(
            "El número de comensales debe ser un número entero"
          )
          .positive(
            "El número de comensales debe ser mayor que cero"
          ),
    })
    .strict();

export const updateReservaMesaSchema =
  z
    .object({
      estado: z.enum(
        [
          "confirmada",
          "cancelada",
        ],
        {
          error:
            "El estado de la reserva no es válido",
        }
      ),
    })
    .strict();