import { extraEs, type ExtraKey } from '@/i18n/publicExtra';
import { z } from 'zod';
import { getTodayInGuatemala, isValidCalendarDate } from '@/features/crear-reserva/schemas/busquedaReservaSchema';

const PAST_DATE_TIME_ES = 'La fecha y hora de la cita no pueden ser anteriores al momento actual en Guatemala.';

const nowInGuatemala = () => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Guatemala', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).format(new Date());

/**
 * El servidor no rechaza citas en el pasado; el formulario evita enviarlas.
 * Compara con la fecha y hora actuales de Guatemala, sin calcular franjas ni disponibilidad.
 */
export function isPastWellnessStart(fecha: string, horaInicio: string): boolean {
  const today = getTodayInGuatemala();
  if (fecha < today) return true;
  return fecha === today && horaInicio.slice(0, 5) < nowInGuatemala();
}

export const createReservaCitaSchema = (
  message: (key: ExtraKey) => string = (key) => extraEs[key],
  pastMessage: string = PAST_DATE_TIME_ES,
) => z.object({
  servicio_bienestar_id: z.number({
    required_error: message('requiredService'),
    invalid_type_error: message('invalidService'),
  }).int(message('validService')).positive(message('validService')),
  terapeuta_id: z.preprocess((value) => typeof value === 'number' && Number.isNaN(value) ? undefined : value, z.number({
    required_error: message('requiredTherapist'),
    invalid_type_error: message('invalidTherapist'),
  }).int(message('validTherapist')).positive(message('validTherapist'))),
  fecha: z.string({
    required_error: message('requiredDateSchema'),
    invalid_type_error: message('wellnessValidDate'),
  }).refine(isValidCalendarDate, message('wellnessValidDate')),
  hora_inicio: z.string({
    required_error: message('requiredStart'),
    invalid_type_error: message('timeFormat'),
  }).regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, message('timeFormat')),
}).superRefine((values, ctx) => {
  if (typeof values.fecha === 'string' && typeof values.hora_inicio === 'string' && isPastWellnessStart(values.fecha, values.hora_inicio)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hora_inicio'], message: pastMessage });
  }
});
export const reservaCitaSchema = createReservaCitaSchema();

export type ReservaCitaFormValues = z.infer<typeof reservaCitaSchema>;

export const servicioSpaSchema = z.object({
  nombre: z.string({
    required_error: 'El nombre es obligatorio',
  }).min(1, 'El nombre no puede estar vacío').max(100, 'Máximo 100 caracteres'),
  duracion_minutos: z.number({
    required_error: 'La duración en minutos es obligatoria',
    invalid_type_error: 'La duración debe ser un número entero',
  }).int('Debe ser un número entero').positive('La duración debe ser mayor a 0 minutos'),
  precio: z.number({
    required_error: 'El precio es obligatorio',
    invalid_type_error: 'El precio debe ser un número válido',
  }).min(0, 'El precio no puede ser negativo'),
});

export type ServicioSpaFormValues = z.infer<typeof servicioSpaSchema>;

export const terapeutaSchema = z.object({
  nombre: z.string({
    required_error: 'El nombre es obligatorio',
  }).min(1, 'El nombre no puede estar vacío').max(100, 'Máximo 100 caracteres'),
  activo: z.boolean().default(true),
});

export type TerapeutaFormValues = z.infer<typeof terapeutaSchema>;

export const citaEstadoSchema = z.object({
  estado: z.enum(['confirmada', 'cancelada', 'completada'], {
    required_error: 'Debe seleccionar un estado',
    invalid_type_error: 'Estado no válido',
  }),
});

export type CitaEstadoFormValues = z.infer<typeof citaEstadoSchema>;
