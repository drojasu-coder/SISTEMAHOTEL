import { z } from "zod";

const fechaHoraSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/,
    "La fecha y hora deben estar en formato ISO 8601 e incluir zona horaria"
  );

const ubicacionSchema = z
  .string()
  .trim()
  .min(
    2,
    "La ubicación debe tener al menos 2 caracteres"
  )
  .max(
    150,
    "La ubicación no puede superar 150 caracteres"
  );

export const createReservaTransporteSchema = z
  .object({
    origen: ubicacionSchema,

    destino: ubicacionSchema,

    fecha_hora: fechaHoraSchema,

    numero_pasajeros: z
      .number()
      .int()
      .positive(
        "El número de pasajeros debe ser mayor que cero"
      ),
  })
  .strict();

export const updateReservaTransporteSchema = z
  .object({
    origen:
      ubicacionSchema.optional(),

    destino:
      ubicacionSchema.optional(),

    fecha_hora:
      fechaHoraSchema.optional(),

    numero_pasajeros: z
      .number()
      .int()
      .positive(
        "El número de pasajeros debe ser mayor que cero"
      )
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