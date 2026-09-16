import { z } from "zod";
import { MODULOS_PAGO } from "../../services/pagos/pago.config";

const tiposDisponibles = Object.keys(MODULOS_PAGO) as [string, ...string[]];

export const createPaymentIntentSchema = z.object({
  tipoModulo: z.enum(tiposDisponibles),
  itemId: z.number().int().positive(),
});