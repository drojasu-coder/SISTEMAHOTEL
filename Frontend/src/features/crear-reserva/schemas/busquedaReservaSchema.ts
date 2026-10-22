import { z } from 'zod';
import type { DisponibilidadHabitacionQuery } from '../types';

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD según la zona horaria del hotel (America/Guatemala).
 */
export function getTodayInGuatemala(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Comprueba si una cadena representa una fecha válida real de calendario en formato YYYY-MM-DD.
 * No genera desfases de zona horaria al evaluar exclusivamente en UTC.
 */
export function isValidCalendarDate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export const busquedaReservaFormSchema = z
  .object({
    sucursal_id: z
      .string({ required_error: 'Debe seleccionar una sede' })
      .trim()
      .min(1, 'Debe seleccionar una sede')
      .refine(
        (val) => {
          const num = Number(val);
          return !Number.isNaN(num) && Number.isInteger(num) && num > 0;
        },
        { message: 'Debe seleccionar una sede válida' }
      ),

    fecha_entrada: z
      .string({ required_error: 'La fecha de entrada es obligatoria' })
      .trim()
      .min(1, 'La fecha de entrada es obligatoria')
      .refine(isValidCalendarDate, {
        message:
          'La fecha de entrada debe ser una fecha de calendario válida (AAAA-MM-DD)',
      })
      .refine(
        (val) => {
          const today = getTodayInGuatemala();
          return val >= today;
        },
        {
          message: 'La fecha de entrada no puede ser anterior a hoy en Guatemala',
        }
      ),

    fecha_salida: z
      .string({ required_error: 'La fecha de salida es obligatoria' })
      .trim()
      .min(1, 'La fecha de salida es obligatoria')
      .refine(isValidCalendarDate, {
        message:
          'La fecha de salida debe ser una fecha de calendario válida (AAAA-MM-DD)',
      }),

    numero_huespedes: z
      .string({ required_error: 'El número de huéspedes es obligatorio' })
      .trim()
      .min(1, 'El número de huéspedes es obligatorio')
      .refine(
        (val) => {
          const num = Number(val);
          return !Number.isNaN(num) && Number.isInteger(num) && num > 0;
        },
        {
          message: 'El número de huéspedes debe ser un número entero mayor a cero',
        }
      ),

    tipo_habitacion_id: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (
        !isValidCalendarDate(data.fecha_entrada) ||
        !isValidCalendarDate(data.fecha_salida)
      ) {
        return true;
      }
      return data.fecha_salida > data.fecha_entrada;
    },
    {
      message: 'La fecha de salida debe ser posterior a la fecha de entrada',
      path: ['fecha_salida'],
    }
  );

export type BusquedaReservaFormData = z.infer<typeof busquedaReservaFormSchema>;

/**
 * Convierte los datos del formulario a los parámetros exactos requeridos por reservasApi.getDisponibilidad.
 */
export function toDisponibilidadQuery(
  data: BusquedaReservaFormData
): DisponibilidadHabitacionQuery {
  const query: DisponibilidadHabitacionQuery = {
    sucursal_id: Number(data.sucursal_id),
    fecha_entrada: data.fecha_entrada,
    fecha_salida: data.fecha_salida,
    numero_huespedes: Number(data.numero_huespedes),
  };

  if (
    data.tipo_habitacion_id &&
    data.tipo_habitacion_id !== '' &&
    data.tipo_habitacion_id !== 'all'
  ) {
    const tipoId = Number(data.tipo_habitacion_id);
    if (!Number.isNaN(tipoId) && tipoId > 0) {
      query.tipo_habitacion_id = tipoId;
    }
  }

  return query;
}
