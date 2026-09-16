import { z } from "zod";

// Expresión regular simple para validar formato HH:MM o HH:MM:SS
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export const createReservaActividadSchema = z
  .object({
    recurso_id: z.number().int().positive("El ID del recurso debe ser positivo"),
    instructor_id: z.number().int().positive().optional().nullable(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato YYYY-MM-DD"),
    hora_inicio: z.string().regex(timeRegex, "La hora de inicio debe tener formato HH:MM o HH:MM:SS"),
    hora_fin: z.string().regex(timeRegex, "La hora de fin debe tener formato HH:MM o HH:MM:SS"),
    con_equipo: z.boolean().optional()
  })
  .strict();

export const updateReservaActividadSchema = z
  .object({
    estado: z.string().max(20).optional(),
    con_equipo: z.boolean().optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });