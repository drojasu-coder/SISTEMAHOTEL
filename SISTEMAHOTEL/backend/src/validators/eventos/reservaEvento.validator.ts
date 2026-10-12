import { z } from "zod";

const tipoEventoSchema = z.enum(
  [
    "boda",
    "cumpleanos",
    "ejecutivo",
    "convivio",
  ],
  {
    error: "El tipo de evento no es válido",
  }
);

const fechaSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "La fecha debe tener formato YYYY-MM-DD"
  );

const horaSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "La hora debe tener formato HH:mm"
  );

export const createReservaEventoSchema = z
  .object({
    salon_id: z
      .number()
      .int()
      .positive(
        "El salón debe ser válido"
      ),

    tipo_evento: tipoEventoSchema,

    fecha: fechaSchema,

    hora_inicio: horaSchema,

    hora_fin: horaSchema,

    numero_invitados: z
      .number()
      .int()
      .positive(
        "El número de invitados debe ser mayor que cero"
      ),
  })
  .strict();

export const updateReservaEventoSchema = z
  .object({
    salon_id: z
      .number()
      .int()
      .positive()
      .optional(),

    tipo_evento:
      tipoEventoSchema.optional(),

    fecha:
      fechaSchema.optional(),

    hora_inicio:
      horaSchema.optional(),

    hora_fin:
      horaSchema.optional(),

    numero_invitados: z
      .number()
      .int()
      .positive()
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