import { z } from 'zod';

export const tipoEventoEnum = z.enum(['boda', 'cumpleanos', 'ejecutivo', 'convivio']);

export const createReservaEventoFormSchema = z
  .object({
    salon_id: z.number().int().positive('Debe seleccionar un salón válido'),
    tipo_evento: tipoEventoEnum,
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD')
      .refine((val) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(`${val}T00:00:00`);
        return selected >= today;
      }, 'La fecha del evento debe ser a partir de hoy'),
    hora_inicio: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora debe tener formato HH:mm'),
    hora_fin: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora debe tener formato HH:mm'),
    numero_invitados: z
      .number({ invalid_type_error: 'Indique la cantidad de invitados' })
      .int('El número de invitados debe ser un entero')
      .positive('El número de invitados debe ser mayor que cero'),
  })
  .refine((data) => data.hora_inicio < data.hora_fin, {
    message: 'La hora de finalización debe ser posterior a la de inicio',
    path: ['hora_fin'],
  });

export type CreateReservaEventoFormData = z.infer<typeof createReservaEventoFormSchema>;

export const addReservaEventoServicioFormSchema = z.object({
  servicio_evento_id: z.number().int().positive('Seleccione un servicio válido'),
  cantidad: z
    .number({ invalid_type_error: 'Indique la cantidad requerida' })
    .int('La cantidad debe ser un entero')
    .positive('La cantidad debe ser mayor a 0'),
});

export type AddReservaEventoServicioFormData = z.infer<typeof addReservaEventoServicioFormSchema>;

export const salonFormSchema = z.object({
  sucursal_id: z.number().int().positive('Debe seleccionar una sede válida'),
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  capacidad_maxima: z
    .number({ invalid_type_error: 'Indique la capacidad máxima' })
    .int('La capacidad debe ser un número entero')
    .positive('La capacidad debe ser mayor que cero'),
  tarifa_base: z
    .number({ invalid_type_error: 'Indique la tarifa base' })
    .positive('La tarifa base debe ser mayor que cero'),
  descripcion: z.string().trim().max(1000, 'La descripción es muy larga').optional().nullable(),
});

export type SalonFormData = z.infer<typeof salonFormSchema>;

export const servicioEventoFormSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  precio: z
    .number({ invalid_type_error: 'Indique el precio' })
    .nonnegative('El precio debe ser un valor no negativo'),
});

export type ServicioEventoFormData = z.infer<typeof servicioEventoFormSchema>;
