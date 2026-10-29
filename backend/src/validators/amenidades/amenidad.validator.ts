import { z } from "zod";
import { horaOperacionSchema } from "../../utils/franjasHorarias";

// Duración fija de cada reserva (minutos); null la deja sin configurar.
const duracionMinutos = z.number().int().positive("La duración debe ser mayor a 0").max(24 * 60).nullable().optional();

export const createAmenidadSchema = z
  .object({
    sucursal_id: z.number().int().positive("El ID de la sucursal debe ser positivo"),
    nombre: z.string().trim().min(1).max(100, "El nombre no puede superar 100 caracteres"),
    aforo_maximo: z.number().int().positive("El aforo máximo debe ser mayor a 0"),
    reservable: z.boolean().optional(),
    hora_apertura: horaOperacionSchema,
    hora_cierre: horaOperacionSchema,
    duracion_minutos: duracionMinutos,
  })
  .strict();

export const updateAmenidadSchema = z
  .object({
    nombre: z.string().trim().min(1).max(100).optional(),
    aforo_maximo: z.number().int().positive().optional(),
    reservable: z.boolean().optional(),
    hora_apertura: horaOperacionSchema,
    hora_cierre: horaOperacionSchema,
    duracion_minutos: duracionMinutos,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });