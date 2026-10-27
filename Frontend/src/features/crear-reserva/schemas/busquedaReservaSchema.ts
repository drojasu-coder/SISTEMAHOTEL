import { extraEs, type ExtraKey } from '@/i18n/publicExtra';
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

export const createBusquedaReservaSchema = (message: (key: ExtraKey) => string = (key) => extraEs[key]) => z
  .object({
    sucursal_id: z
      .string({ required_error: message('requiredSite') })
      .trim()
      .min(1, message('requiredSite'))
      .refine(
        (val) => {
          const num = Number(val);
          return !Number.isNaN(num) && Number.isInteger(num) && num > 0;
        },
        { message: message('validSite') }
      ),

    fecha_entrada: z
      .string({ required_error: message('requiredArrival') })
      .trim()
      .min(1, message('requiredArrival'))
      .refine(isValidCalendarDate, {
        message:
          message('validArrival'),
      })
      .refine(
        (val) => {
          const today = getTodayInGuatemala();
          return val >= today;
        },
        {
          message: message('arrivalPast'),
        }
      ),

    fecha_salida: z
      .string({ required_error: message('requiredDeparture') })
      .trim()
      .min(1, message('requiredDeparture'))
      .refine(isValidCalendarDate, {
        message:
          message('validDeparture'),
      }),

    numero_huespedes: z
      .string({ required_error: message('requiredGuests') })
      .trim()
      .min(1, message('requiredGuests'))
      .refine(
        (val) => {
          const num = Number(val);
          return !Number.isNaN(num) && Number.isInteger(num) && num > 0;
        },
        {
          message: message('validGuests'),
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
      message: message('departureAfter'),
      path: ['fecha_salida'],
    }
  );
export const busquedaReservaFormSchema = createBusquedaReservaSchema();

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
