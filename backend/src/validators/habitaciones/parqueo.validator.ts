import { z } from "zod";

const estadosParqueo = ["disponible", "ocupado", "mantenimiento"] as const;

const parqueoFields = {
  sucursal_id: z
    .number()
    .int("El ID de la sucursal debe ser un número entero")
    .positive("El ID de la sucursal debe ser positivo"),
  numero: z
    .string()
    .trim()
    .min(1, "El número de parqueo es obligatorio")
    .max(10, "El número de parqueo no puede superar 10 caracteres"),
  estado: z
    .enum(estadosParqueo, {
      message: "El estado debe ser disponible, ocupado o mantenimiento",
    })
    .optional(),
};

export const createParqueoSchema = z.object(parqueoFields).strict();
export const updateParqueoSchema = z.object(parqueoFields).partial().strict();
export const parqueoIdSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d+$/, "El ID debe contener únicamente dígitos")
      .transform(Number)
      .refine((id) => id > 0, "El ID debe ser un número positivo"),
  })
  .strict();
