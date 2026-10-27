import { extraEs, type ExtraKey } from '@/i18n/publicExtra';
import { z } from 'zod';

export const createReservaCitaSchema = (message: (key: ExtraKey) => string = (key) => extraEs[key]) => z.object({
  servicio_bienestar_id: z.number({
    required_error: message('requiredService'),
    invalid_type_error: message('invalidService'),
  }).int().positive(message('validService')),
  terapeuta_id: z.number({
    required_error: message('requiredTherapist'),
    invalid_type_error: message('invalidTherapist'),
  }).int().positive(message('validTherapist')),
  fecha: z.string({
    required_error: message('requiredDateSchema'),
  }).regex(/^\d{4}-\d{2}-\d{2}$/, message('dateFormat')),
  hora_inicio: z.string({
    required_error: message('requiredStart'),
  }).regex(/^\d{2}:\d{2}(:\d{2})?$/, message('timeFormat')),
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
