import { z } from "zod";

export const createAmenidadSchema = z
  .object({
    sucursal_id: z.number().int().positive("El ID de la sucursal debe ser positivo"),
    nombre: z.string().trim().min(1).max(100, "El nombre no puede superar 100 caracteres"),
    aforo_maximo: z.number().int().positive("El aforo máximo debe ser mayor a 0"),
  })
  .strict();

export const updateAmenidadSchema = z
  .object({
    nombre: z.string().trim().min(1).max(100).optional(),
    aforo_maximo: z.number().int().positive().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });