import { z } from "zod";

const tipoVehiculoSchema = z.enum(
  [
    "shuttle",
    "van",
    "sedan",
  ],
  {
    error:
      "El tipo de vehículo no es válido",
  }
);

const placaSchema = z
  .string()
  .trim()
  .min(
    1,
    "La placa no puede estar vacía"
  )
  .max(
    20,
    "La placa no puede superar 20 caracteres"
  );

export const createVehiculoSchema = z
  .object({
    tipo:
      tipoVehiculoSchema,

    capacidad: z
      .number()
      .int()
      .positive(
        "La capacidad debe ser mayor que cero"
      ),

    placa:
      placaSchema
        .optional()
        .nullable(),
  })
  .strict();

export const updateVehiculoSchema = z
  .object({
    tipo:
      tipoVehiculoSchema
        .optional(),

    capacidad: z
      .number()
      .int()
      .positive(
        "La capacidad debe ser mayor que cero"
      )
      .optional(),

    placa:
      placaSchema
        .nullable()
        .optional(),
  })
  .strict()
  .refine(
    (data) =>
      Object.keys(data).length > 0,
    {
      message:
        "Debe enviar al menos un campo para actualizar",
    }
  );