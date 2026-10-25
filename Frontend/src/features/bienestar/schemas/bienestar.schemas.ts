import { z } from 'zod';

export const reservaCitaSchema = z.object({
  servicio_bienestar_id: z.number({
    required_error: 'Debe seleccionar un servicio',
    invalid_type_error: 'Servicio inválido',
  }).int().positive('Debe seleccionar un servicio válido'),
  terapeuta_id: z.number({
    required_error: 'Debe seleccionar un terapeuta',
    invalid_type_error: 'Terapeuta inválido',
  }).int().positive('Debe seleccionar un terapeuta válido'),
  fecha: z.string({
    required_error: 'La fecha es obligatoria',
  }).regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
  hora_inicio: z.string({
    required_error: 'La hora de inicio es obligatoria',
  }).regex(/^\d{2}:\d{2}(:\d{2})?$/, 'La hora debe tener formato HH:MM (ej. 10:00)'),
});

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
