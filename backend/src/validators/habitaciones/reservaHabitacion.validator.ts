import { z } from "zod";

const estadosReserva = [
  "pendiente",
  "confirmada",
  "cancelada",
  "finalizada",
  "expirada",
] as const;

const fecha = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "La fecha debe tener el formato AAAA-MM-DD"
  )
  .refine(
    (value) => {
      const parsedDate =
        new Date(
          `${value}T00:00:00Z`
        );

      return (
        !Number.isNaN(
          parsedDate.getTime()
        ) &&
        parsedDate
          .toISOString()
          .slice(0, 10) ===
          value
      );
    },
    "La fecha no es válida"
  );

const reservaFields = {
  usuario_id: z
    .number()
    .int(
      "El ID del usuario debe ser un número entero"
    )
    .positive(
      "El ID del usuario debe ser positivo"
    ),

  habitacion_id: z
    .number()
    .int(
      "El ID de la habitación debe ser un número entero"
    )
    .positive(
      "El ID de la habitación debe ser positivo"
    ),

  fecha_entrada:
    fecha,

  fecha_salida:
    fecha,

  numero_huespedes: z
    .number()
    .int(
      "El número de huéspedes debe ser un número entero"
    )
    .positive(
      "El número de huéspedes debe ser mayor que cero"
    ),

  estado: z
    .enum(
      estadosReserva
    )
    .optional(),
};

export const createReservaHabitacionSchema =
  z
    .object({
      /**
       * Para cliente se obtiene desde JWT.
       * Para administración se solicita
       * explícitamente en el controller.
       */
      usuario_id:
        reservaFields.usuario_id.optional(),

      habitacion_id:
        reservaFields.habitacion_id,

      fecha_entrada:
        reservaFields.fecha_entrada,

      fecha_salida:
        reservaFields.fecha_salida,

      numero_huespedes:
        reservaFields.numero_huespedes,
    })
    .strict();

export const updateReservaHabitacionSchema =
  z
    .object(
      reservaFields
    )
    .partial()
    .strict()
    .refine(
      (data) =>
        Object.keys(
          data
        ).length > 0,
      {
        message:
          "Debe enviar al menos un campo para actualizar",
      }
    );

export const reservaHabitacionIdSchema =
  z
    .object({
      id: z
        .string()
        .regex(
          /^\d+$/,
          "El ID debe contener únicamente dígitos"
        )
        .transform(
          Number
        )
        .refine(
          (id) =>
            id > 0,
          "El ID debe ser un número positivo"
        ),
    })
    .strict();
