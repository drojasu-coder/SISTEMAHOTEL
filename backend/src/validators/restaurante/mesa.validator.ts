import { z } from "zod";

export const createMesaSchema = z
  .object({
    sucursal_id: z
      .number()
      .int("El ID de la sucursal debe ser un numero entero")
      .positive("El ID de la sucursal debe ser positivo"),

    zona: z
      .string()
      .trim()
      .min(1, "La zona no puede estar vacia")
      .max(30, "La zona no puede superar 30 caracteres"),

    capacidad: z
      .number()
      .int("La capacidad debe ser un numero entero")
      .positive("La capacidad debe ser mayor a 0"),

    estado: z
      .string()
      .trim()
      .max(20, "El estado no puede superar 20 caracteres")
      .optional()
      .nullable(),
  })
  .strict();

export const updateMesaSchema = z
  .object({
    zona: z
      .string()
      .trim()
      .min(1, "La zona no puede estar vacia")
      .max(30, "La zona no puede superar 30 caracteres")
      .optional(),

    capacidad: z
      .number()
      .int("La capacidad debe ser un numero entero")
      .positive("La capacidad debe ser mayor a 0")
      .optional(),

    estado: z
      .string()
      .trim()
      .max(20, "El estado no puede superar 20 caracteres")
      .optional()
      .nullable(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Debe enviar al menos un campo para actualizar",
    }
  );