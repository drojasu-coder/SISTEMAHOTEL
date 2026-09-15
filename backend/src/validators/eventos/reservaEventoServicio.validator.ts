import { z } from "zod";

const positiveId = z
  .string()
  .regex(
    /^[1-9]\d*$/,
    "El id debe ser un número entero positivo"
  );

export const reservaEventoParamSchema = z
  .object({
    reservaId: positiveId,
  })
  .strict();

export const reservaEventoServicioParamsSchema = z
  .object({
    reservaId: positiveId,
    id: positiveId,
  })
  .strict();

export const createReservaEventoServicioSchema = z
  .object({
    servicio_evento_id: z
      .number()
      .int()
      .positive(
        "El servicio de evento debe ser válido"
      ),

    cantidad: z
      .number()
      .int()
      .positive(
        "La cantidad debe ser mayor que cero"
      )
      .default(1),
  })
  .strict();

export const updateReservaEventoServicioSchema = z
  .object({
    cantidad: z
      .number()
      .int()
      .positive(
        "La cantidad debe ser mayor que cero"
      ),
  })
  .strict();