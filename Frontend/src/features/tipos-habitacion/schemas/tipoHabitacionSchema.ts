import { z } from "zod";
import type { CreateTipoHabitacionInput, UpdateTipoHabitacionInput } from "../types";

export const mensajesTipoHabitacion = {
  nombreVacio: "El nombre del tipo de habitación es obligatorio",
  nombreLargo: "El nombre no puede superar 50 caracteres",
  capacidadVacia: "La capacidad máxima es obligatoria",
  capacidadInvalida: "La capacidad máxima debe ser un número entero mayor a 0",
  tarifaVacia: "La tarifa por noche es obligatoria",
  tarifaFormato: "La tarifa debe ser un número válido con hasta dos decimales (ej. 150.00)",
  tarifaNegativa: "La tarifa no puede ser negativa, debe ser mayor o igual a cero",
  descripcionLarga: "La descripción no puede superar 500 caracteres",
};

/**
 * Esquema de validación del formulario de tipo de habitación.
 *
 * En los campos numéricos, se valida explícitamente el valor antes de cualquier
 * conversión numérica: una tarifa vacía NO se convierte automáticamente a 0
 * y genera un error de validación.
 *
 * El valor 0 introducido de forma explícita ("0" o "0.00") es completamente
 * válido según el contrato de backend (moneySchema: value >= 0).
 */
export const tipoHabitacionFormSchema = z.object({
  nombre: z
    .string({ required_error: mensajesTipoHabitacion.nombreVacio })
    .trim()
    .min(1, mensajesTipoHabitacion.nombreVacio)
    .max(50, mensajesTipoHabitacion.nombreLargo),

  capacidad_maxima: z
    .string({ required_error: mensajesTipoHabitacion.capacidadVacia })
    .trim()
    .min(1, mensajesTipoHabitacion.capacidadVacia)
    .refine(
      (val) => /^\d+$/.test(val) && Number(val) > 0,
      mensajesTipoHabitacion.capacidadInvalida
    ),

  tarifa_noche: z
    .string({ required_error: mensajesTipoHabitacion.tarifaVacia })
    .trim()
    .min(1, mensajesTipoHabitacion.tarifaVacia)
    .refine(
      (val) => /^\d+(\.\d{1,2})?$/.test(val),
      mensajesTipoHabitacion.tarifaFormato
    )
    .refine(
      (val) => Number(val) >= 0,
      mensajesTipoHabitacion.tarifaNegativa
    ),

  descripcion: z
    .string()
    .trim()
    .max(500, mensajesTipoHabitacion.descripcionLarga)
    .optional()
    .or(z.literal("")),
});

export type TipoHabitacionFormData = z.infer<typeof tipoHabitacionFormSchema>;

export const CAMPOS_TIPO_HABITACION = [
  "nombre",
  "capacidad_maxima",
  "tarifa_noche",
  "descripcion",
] as const;

/**
 * Normaliza y convierte los valores válidos del formulario para el payload de creación.
 */
export function sanitizeCreateTipoHabitacion(
  values: TipoHabitacionFormData
): CreateTipoHabitacionInput {
  return {
    nombre: values.nombre.trim(),
    capacidad_maxima: Number(values.capacidad_maxima),
    tarifa_noche: Number(values.tarifa_noche),
    descripcion: values.descripcion?.trim() ? values.descripcion.trim() : null,
  };
}

/**
 * Normaliza y convierte los valores válidos para el payload de actualización parcial.
 */
export function sanitizeUpdateTipoHabitacion(
  values: TipoHabitacionFormData
): UpdateTipoHabitacionInput {
  return {
    nombre: values.nombre.trim(),
    capacidad_maxima: Number(values.capacidad_maxima),
    tarifa_noche: Number(values.tarifa_noche),
    descripcion: values.descripcion?.trim() ? values.descripcion.trim() : null,
  };
}
