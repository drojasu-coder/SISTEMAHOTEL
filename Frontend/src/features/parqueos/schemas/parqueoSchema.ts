import { z } from "zod";
import { ESTADOS_PARQUEO, type CreateParqueoInput } from "../types";

/**
 * Reglas de validación espejo del backend
 * (backend/src/validators/habitaciones/parqueo.validator.ts):
 * - sucursal_id: entero positivo
 * - numero: texto de 1 a 10 caracteres, único dentro de la sede
 * - estado: uno de disponible, ocupado o mantenimiento
 */
export const parqueoFormSchema = z.object({
  sucursal_id: z.coerce
    .number({
      required_error: "Debe seleccionar una sede",
      invalid_type_error: "Debe seleccionar una sede válida",
    })
    .int("El identificador de la sede debe ser un número entero")
    .positive("Debe seleccionar una sede válida"),

  numero: z
    .string({ required_error: "El número de parqueo es obligatorio" })
    .trim()
    .min(1, "El número de parqueo es obligatorio")
    .max(10, "El número no puede superar 10 caracteres"),

  estado: z.enum(ESTADOS_PARQUEO, {
    required_error: "Debe seleccionar un estado",
    invalid_type_error: "Debe seleccionar un estado válido",
  }),
});

export type ParqueoFormData = z.infer<typeof parqueoFormSchema>;

/**
 * Normaliza y prepara el payload de alta para su envío al backend.
 */
export function sanitizeParqueoPayload(data: ParqueoFormData): CreateParqueoInput {
  return {
    sucursal_id: Number(data.sucursal_id),
    numero: data.numero.trim(),
    estado: data.estado,
  };
}
