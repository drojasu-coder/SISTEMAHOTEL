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

export const createReservaActividadSchema =
  z
    .object({
      recurso_id: z
        .number()
        .int(
          "El ID del recurso debe ser un número entero"
        )
        .positive(
          "El ID del recurso debe ser positivo"
        ),

      instructor_id: z
        .number()
        .int(
          "El ID del instructor debe ser un número entero"
        )
        .positive(
          "El ID del instructor debe ser positivo"
        )
        .nullable()
        .optional(),

      fecha,

      hora_inicio: z
        .string()
        .regex(
          timeRegex,
          "La hora de inicio debe tener formato HH:MM o HH:MM:SS"
        ),

      // Obligatoria para recursos por hora; en experiencias se calcula en el servidor.
      hora_fin: z
        .string()
        .regex(
          timeRegex,
          "La hora de fin debe tener formato HH:MM o HH:MM:SS"
        )
        .optional(),

      con_equipo: z
        .boolean()
        .optional(),

      numero_participantes: z
        .number()
        .int("El número de participantes debe ser un número entero")
        .min(1, "Debe haber al menos un participante")
        .max(100, "El número de participantes no puede superar 100")
        .optional(),
    })
    .strict();

export const updateReservaActividadSchema =
  z
    .object({
      estado: z
        .enum(
          [
            "confirmada",
            "cancelada",
            "completada",
          ],
          {
            error:
              "El estado debe ser confirmada, cancelada o completada",
          }
        )
        .optional(),

      con_equipo: z
        .boolean()
        .optional(),
    })
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