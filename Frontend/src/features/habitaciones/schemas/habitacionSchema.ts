import { z } from "zod";
import { ESTADOS_HABITACION, type CreateHabitacionInput } from "../types";

export const habitacionFormSchema = z.object({
  sucursal_id: z.coerce
    .number({
      required_error: "Debe seleccionar una sede",
      invalid_type_error: "Debe seleccionar una sede válida",
    })
    .int("El identificador de la sede debe ser un número entero")
    .positive("Debe seleccionar una sede válida"),

  tipo_habitacion_id: z.coerce
    .number({
      required_error: "Debe seleccionar un tipo de habitación",
      invalid_type_error: "Debe seleccionar un tipo de habitación válido",
    })
    .int("El identificador del tipo de habitación debe ser un número entero")
    .positive("Debe seleccionar un tipo de habitación válido"),

  numero: z
    .string({ required_error: "El número de habitación es obligatorio" })
    .trim()
    .min(1, "El número de habitación es obligatorio")
    .max(10, "El número no puede superar 10 caracteres"),

  estado: z.enum(ESTADOS_HABITACION, {
    required_error: "Debe seleccionar un estado",
  }),
});

export type HabitacionFormData = z.infer<typeof habitacionFormSchema>;

/**
 * Normaliza y prepara el payload para su envío al backend.
 */
export function sanitizeHabitacionPayload(data: HabitacionFormData): CreateHabitacionInput {
  return {
    sucursal_id: Number(data.sucursal_id),
    tipo_habitacion_id: Number(data.tipo_habitacion_id),
    numero: data.numero.trim(),
    estado: data.estado,
  };
}
