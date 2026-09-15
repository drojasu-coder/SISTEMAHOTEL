import { z } from "zod";

export const createInstructorSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150),
    especialidad: z.string().trim().max(50).optional().nullable(),
    activo: z.boolean().optional(),
  })
  .strict();

export const updateInstructorSchema = z
  .object({
    nombre: z.string().trim().min(1).max(150).optional(),
    especialidad: z.string().trim().max(50).optional().nullable(),
    activo: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });