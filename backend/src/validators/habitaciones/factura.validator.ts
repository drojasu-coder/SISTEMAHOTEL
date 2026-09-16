import { z } from "zod";

const money = z
  .number()
  .finite("El valor debe ser un número válido")
  .nonnegative("El valor no puede ser negativo");

const fechaEmision = z
  .string()
  .datetime({ message: "La fecha de emisión debe tener un formato válido" });
const estadosFactura = ["pendiente", "pagada", "anulada"] as const;

export const createFacturaSchema = z
  .object({
    usuario_id: z.number().int().positive(),
    nit: z.string().trim().min(1).max(20),
    nombre_fiscal: z.string().trim().min(1).max(150),
    direccion_fiscal: z.string().trim().max(255).nullable().optional(),
    subtotal: z.literal(0, {
      message: "El subtotal inicial debe ser 0",
    }),
    estado: z.enum(estadosFactura).optional(),
    fecha_emision: fechaEmision.optional(),
  })
  .strict();

export const updateFacturaSchema = z
  .object({
    usuario_id: z.number().int().positive(),
    nit: z.string().trim().min(1).max(20),
    nombre_fiscal: z.string().trim().min(1).max(150),
    direccion_fiscal: z.string().trim().max(255).nullable(),
    subtotal: money,
    estado: z.enum(estadosFactura),
    fecha_emision: fechaEmision.nullable(),
  })
  .partial()
  .strict();

export const facturaIdSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d+$/, "El ID debe contener únicamente dígitos")
      .transform(Number)
      .refine((id) => id > 0, "El ID debe ser un número positivo"),
  })
  .strict();
