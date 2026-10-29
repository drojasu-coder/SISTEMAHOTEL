import { z } from "zod";
import type { CreateAmenidadInput, UpdateAmenidadInput } from "../types";

export const mensajesAmenidad = {
  sedeVacia: "Debe seleccionar una sede para la amenidad",
  sedeInvalida: "Debe seleccionar una sede válida",
  nombreVacio: "El nombre de la amenidad es obligatorio",
  nombreLargo: "El nombre no puede superar 100 caracteres",
  aforoVacio: "El aforo máximo es obligatorio",
  aforoInvalido: "El aforo máximo debe ser un número entero mayor a 0",
  horaInvalida: "Hora no válida",
  horarioIncompleto: "Indique apertura, cierre y duración, o deje los tres vacíos",
  cierreAnterior: "El cierre debe ser posterior a la apertura",
  duracionInvalida: "La duración debe ser un número entero de minutos mayor a 0",
  horarioCorto: "El horario es más corto que la duración de una reserva",
};

const HORA = /^$|^([01]\d|2[0-3]):[0-5]\d$/;
const minutosDe = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

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

  // Horario de reserva y duración fija: los tres o ninguno. Sin ellos no hay reservas en línea.
  hora_apertura: z.string().regex(HORA, mensajesAmenidad.horaInvalida),
  hora_cierre: z.string().regex(HORA, mensajesAmenidad.horaInvalida),
  duracion_minutos: z.string().trim().refine((val) => val === "" || (/^\d+$/.test(val) && Number(val) > 0), mensajesAmenidad.duracionInvalida),
}).superRefine((data, ctx) => {
  const valores = [data.hora_apertura, data.hora_cierre, data.duracion_minutos.trim()];
  if (valores.every((v) => v === "")) return;
  if (valores.some((v) => v === "")) {
    const campo = !data.hora_apertura ? "hora_apertura" : !data.hora_cierre ? "hora_cierre" : "duracion_minutos";
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [campo], message: mensajesAmenidad.horarioIncompleto });
    return;
  }
  if (minutosDe(data.hora_apertura) >= minutosDe(data.hora_cierre)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["hora_cierre"], message: mensajesAmenidad.cierreAnterior });
  } else if (minutosDe(data.hora_apertura) + Number(data.duracion_minutos) > minutosDe(data.hora_cierre)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["duracion_minutos"], message: mensajesAmenidad.horarioCorto });
  }
});

export type AmenidadFormData = z.infer<typeof amenidadFormSchema>;

export const CAMPOS_AMENIDAD = ["sucursal_id", "nombre", "aforo_maximo", "hora_apertura", "hora_cierre", "duracion_minutos"] as const;

const horarioPayload = (data: AmenidadFormData) => ({
  hora_apertura: data.hora_apertura || null,
  hora_cierre: data.hora_cierre || null,
  duracion_minutos: data.duracion_minutos.trim() ? Number(data.duracion_minutos) : null,
});

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
    ...horarioPayload(data),
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
    ...horarioPayload(data),
  };
}
