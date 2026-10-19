import { z } from "zod";

const tarifa = z
  .number()
  .finite("La tarifa debe ser un numero valido")
  .nonnegative("La tarifa no puede ser negativa");

export const createRecursoActividadSchema = z
  .object({
    sucursal_id: z
      .number()
      .int("El ID de la sucursal debe ser un numero entero")
      .positive("El ID de la sucursal debe ser positivo"),
    tipo: z
      .string()
      .trim()
      .min(1, "El tipo no puede estar vacio")
      .max(30, "El tipo no puede superar 30 caracteres"), // Ej: golf, tenis, billar
    nombre: z
      .string()
      .trim()
      .min(1, "El nombre no puede estar vacio")
      .max(100, "El nombre no puede superar 100 caracteres"), // Ej: Cancha 1
    precio_hora: tarifa.optional(),
    precio_equipo: tarifa.optional(),
    precio_instructor_hora: tarifa.optional(),
  })
  .strict();

export const updateRecursoActividadSchema = z
  .object({
    tipo: z.string().trim().min(1).max(30).optional(),
    nombre: z.string().trim().min(1).max(100).optional(),
    precio_hora: tarifa.optional(),
    precio_equipo: tarifa.optional(),
    precio_instructor_hora: tarifa.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });
