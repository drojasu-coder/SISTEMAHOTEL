import { z } from "zod";

export const createBoletoParqueSchema = z
  .object({
    tipo_boleto: z.string().trim().min(1, "El tipo de boleto es obligatorio").max(50),
    precio: z.number().positive("El precio debe ser mayor a 0"),
    fecha_visita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de visita debe ser YYYY-MM-DD"),
    cantidad: z.number().int().positive("La cantidad debe ser mayor a 0").optional(),
  })
  .strict();

export const updateBoletoParqueSchema = z
  .object({
    estado: z.string().max(20).optional(), // Ej: 'activo', 'usado', 'cancelado'
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });