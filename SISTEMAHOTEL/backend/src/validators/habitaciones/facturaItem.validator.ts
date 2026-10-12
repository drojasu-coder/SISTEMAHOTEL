import { z } from "zod";

const precioUnitario = z
  .number()
  .finite("El precio unitario debe ser un número válido")
  .nonnegative("El precio unitario no puede ser negativo");

export const createFacturaItemSchema = z
  .object({
    factura_id: z.number().int().positive(),
    descripcion: z.string().trim().min(1).max(255),
    cantidad: z.number().int().positive(),
    precio_unitario: precioUnitario,
  })
  .strict();

export const updateFacturaItemSchema = z
  .object({
    factura_id: z.number().int().positive(),
    descripcion: z.string().trim().min(1).max(255),
    cantidad: z.number().int().positive(),
    precio_unitario: precioUnitario,
  })
  .partial()
  .strict();

export const facturaItemIdSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d+$/, "El ID debe contener únicamente dígitos")
      .transform(Number)
      .refine((id) => id > 0, "El ID debe ser un número positivo"),
  })
  .strict();
