import { z } from "zod";

export const createReservaAmenidadSchema = z
  .object({
    amenidad_id: z.number().int().positive("El ID de la amenidad debe ser positivo"),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato YYYY-MM-DD"),
    franja_horaria: z.string().trim().min(1, "La franja horaria es obligatoria (ej: 08:00 - 10:00)"),
    mobiliario: z.string().max(30).optional().nullable(), // camastro, cabaña, ninguno
  })
  .strict();

export const updateReservaAmenidadSchema = z
  .object({
    estado: z.string().max(20).optional(),
    mobiliario: z.string().max(30).optional().nullable(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });