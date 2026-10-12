import { z } from "zod";

import {
  CART_ITEM_TYPES,
} from "../../constants/cart";

const positiveId = z
  .string()
  .regex(
    /^[1-9]\d*$/,
    "El identificador debe ser un número entero positivo"
  );

export const carritoParamSchema =
  z.object({
    carritoId: positiveId,
  })
  .strict();

export const carritoItemParamsSchema =
  z.object({
    carritoId: positiveId,
    id: positiveId,
  })
  .strict();

export const createCarritoItemSchema =
  z.object({
    tipo_item: z.enum(
      CART_ITEM_TYPES,
      {
        error:
          "El tipo de ítem no es válido",
      }
    ),

    referencia_id: z
      .number()
      .int()
      .positive(
        "La referencia debe ser un número entero positivo"
      ),
  })
  .strict();