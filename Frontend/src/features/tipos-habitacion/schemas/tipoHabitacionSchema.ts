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
  sede: "Seleccione una sede autorizada o una categoría general",
};
const english: typeof mensajesTipoHabitacion = {
  nombreVacio: "Room type name is required", nombreLargo: "Name cannot exceed 50 characters",
  capacidadVacia: "Maximum capacity is required", capacidadInvalida: "Capacity must be a positive whole number",
  tarifaVacia: "Nightly rate is required", tarifaFormato: "Enter a valid rate with up to two decimal places",
  tarifaNegativa: "The rate must be zero or greater", descripcionLarga: "Description cannot exceed 500 characters",
  sede: "Select an authorized site or a general category",
};
export function createTipoHabitacionFormSchema(locale: 'es' | 'en' = 'es') {
  const message = locale === 'en' ? english : mensajesTipoHabitacion;
  return z.object({
    sucursal_id: z.string().min(1, message.sede).refine(value =>
      value === "general" || (/^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) <= 2147483647), message.sede),
    nombre: z.string().trim().min(1, message.nombreVacio).max(50, message.nombreLargo),
    capacidad_maxima: z.string().trim().min(1, message.capacidadVacia).refine(value =>
      /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0, message.capacidadInvalida),
    // Empty is invalid; an explicit zero remains valid under the backend contract.
    tarifa_noche: z.string().trim().min(1, message.tarifaVacia)
      .refine(value => /^\d+(\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value)), message.tarifaFormato)
      .refine(value => Number(value) >= 0, message.tarifaNegativa),
    descripcion: z.string().trim().max(500, message.descripcionLarga).optional().or(z.literal("")),
  });
}
export const tipoHabitacionFormSchema = createTipoHabitacionFormSchema();
export type TipoHabitacionFormData = z.infer<typeof tipoHabitacionFormSchema>;
export const CAMPOS_TIPO_HABITACION = ["sucursal_id", "nombre", "capacidad_maxima", "tarifa_noche", "descripcion"] as const;
export function sanitizeCreateTipoHabitacion(values: TipoHabitacionFormData): CreateTipoHabitacionInput {
  return {
    sucursal_id: values.sucursal_id === "general" ? null : Number(values.sucursal_id),
    nombre: values.nombre.trim(), capacidad_maxima: Number(values.capacidad_maxima), tarifa_noche: Number(values.tarifa_noche),
    descripcion: values.descripcion?.trim() ? values.descripcion.trim() : null,
  };
}
export const sanitizeUpdateTipoHabitacion = (values: TipoHabitacionFormData): UpdateTipoHabitacionInput => sanitizeCreateTipoHabitacion(values);
