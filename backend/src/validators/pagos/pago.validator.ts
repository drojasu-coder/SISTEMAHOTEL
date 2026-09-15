import { z } from "zod";

export const createPaymentIntentSchema = z
  .object({
    monto: z.number().positive("El monto debe ser mayor a 0"),
    descripcion: z.string().optional()
  })
  .strict();