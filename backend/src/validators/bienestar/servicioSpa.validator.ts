import { z } from "zod";

export const createServicioSpaSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
    descripcion: z.string().trim().optional().nullable(),
    duracion_minutos: z.number().int().positive("La duración debe ser mayor a 0 minutos"),
    precio: z.number().positive("El precio debe ser mayor a 0"),
  })
  .strict();

export const updateServicioSpaSchema = z
  .object({
    nombre: z.string().trim().min(1).max(100).optional(),
    descripcion: z.string().trim().optional().nullable(),
    duracion_minutos: z.number().int().positive().optional(),
    precio: z.number().positive().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });