import { z } from "zod";

const timeRegex =
  /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export const createReservaMesaSchema =
  z.object({
    mesa_id: z
      .number()
      .int()
      .positive(
        "El ID de la mesa debe ser positivo"
      ),

    fecha: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "La fecha debe tener formato YYYY-MM-DD"
      ),

    hora: z
      .string()
      .regex(
        timeRegex,
        "La hora debe tener formato HH:MM"
      ),

    numero_comensales: z
      .number()
      .int()
      .positive(
        "El número de comensales debe ser mayor que cero"
      ),
  })
  .strict();

export const updateReservaMesaSchema =
  z.object({
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