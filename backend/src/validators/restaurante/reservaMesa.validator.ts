import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export const createReservaMesaSchema = z
  .object({
    mesa_id: z.number().int().positive("El ID de la mesa debe ser positivo"),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD"),
    hora_inicio: z.string().regex(timeRegex, "Formato de hora inicio inválido (HH:MM)"),
    hora_fin: z.string().regex(timeRegex, "Formato de hora fin inválido (HH:MM)"),
    cantidad_personas: z.number().int().positive("La cantidad de personas debe ser mayor a 0")
  })
  .strict();

export const updateReservaMesaSchema = z
  .object({
    estado: z.string().max(20).optional(),
    cantidad_personas: z.number().int().positive().optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });