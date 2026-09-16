import { z } from "zod";

export const createBoletoParqueSchema =
  z.object({
    tipo_boleto: z.enum(
      [
        "adulto",
        "nino",
        "familiar",
      ],
      {
        error:
          "El tipo de boleto debe ser adulto, nino o familiar",
      }
    ),

    fecha_visita: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "La fecha de visita debe tener formato YYYY-MM-DD"
      ),
  })
  .strict();

export const updateBoletoParqueSchema =
  z.object({
    estado: z.enum(
      [
        "valido",
        "usado",
        "cancelado",
      ],
      {
        error:
          "El estado debe ser valido, usado o cancelado",
      }
    ),
  })
  .strict();