import { z } from "zod";
import type { CreateAmenidadInput, UpdateAmenidadInput } from "../types";

export const mensajesAmenidad = {
  sedeVacia: "Debe seleccionar una sede para la amenidad",
  sedeInvalida: "Debe seleccionar una sede válida",
  nombreVacio: "El nombre de la amenidad es obligatorio",
  nombreLargo: "El nombre no puede superar 100 caracteres",
  aforoVacio: "El aforo máximo es obligatorio",
  aforoInvalido: "El aforo máximo debe ser un número entero mayor a 0",
};

/**
 * Esquema de validación para el formulario de amenidades.
 *
 * Los campos numéricos se manejan como cadenas y se validan explícitamente antes
 * de cualquier conversión numérica para evitar que valores vacíos se conviertan
 * automáticamente a 0.
 */
export const amenidadFormSchema = z.object({
  sucursal_id: z
    .string({ required_error: mensajesAmenidad.sedeVacia })
    .trim()
    .min(1, mensajesAmenidad.sedeVacia)
    .refine(
      (val) => /^\d+$/.test(val) && Number(val) > 0,
      mensajesAmenidad.sedeInvalida
    ),

  nombre: z
    .string({ required_error: mensajesAmenidad.nombreVacio })
    .trim()
    .min(1, mensajesAmenidad.nombreVacio)
    .max(100, mensajesAmenidad.nombreLargo),

  aforo_maximo: z
    .string({ required_error: mensajesAmenidad.aforoVacio })
    .trim()
    .min(1, mensajesAmenidad.aforoVacio)
    .refine(
      (val) => /^\d+$/.test(val) && Number(val) > 0,
      mensajesAmenidad.aforoInvalido
    ),
});

export type AmenidadFormData = z.infer<typeof amenidadFormSchema>;

export const CAMPOS_AMENIDAD = ["sucursal_id", "nombre", "aforo_maximo"] as const;

/**
 * Sanitiza y prepara los datos para la creación de una amenidad.
 */
export function sanitizeCreateAmenidad(
  data: AmenidadFormData
): CreateAmenidadInput {
  return {
    sucursal_id: Number(data.sucursal_id),
    nombre: data.nombre.trim(),
    aforo_maximo: Number(data.aforo_maximo),
  };
}

/**
 * Sanitiza y prepara los datos para la actualización de una amenidad.
 * El backend no admite modificar la sucursal en PATCH, por lo que solo envía nombre y aforo.
 */
export function sanitizeUpdateAmenidad(
  data: AmenidadFormData
): UpdateAmenidadInput {
  return {
    nombre: data.nombre.trim(),
    aforo_maximo: Number(data.aforo_maximo),
  };
}
