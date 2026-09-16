import { z } from "zod";

const porcentajeIva = z
  .number()
  .finite("El porcentaje debe ser un número válido")
  .min(0, "El porcentaje no puede ser negativo")
  .max(100, "El porcentaje no puede ser mayor a 100");

export const updateIvaSchema = z
  .object({ porcentaje_iva: porcentajeIva })
  .strict();
