import { extraEs, type ExtraKey } from '@/i18n/publicExtra';
import { z } from 'zod';

export const tipoEventoEnum = z.enum(['boda', 'cumpleanos', 'ejecutivo', 'convivio']);

export const buildReservaEventoSchema = (message: (key: ExtraKey) => string = (key) => extraEs[key]) => z
  .object({
    salon_id: z.number().int().positive(message('validVenue')),
    tipo_evento: tipoEventoEnum,
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, message('eventDateFormat'))
      .refine((val) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(`${val}T00:00:00`);
        return selected >= today;
      }, message('eventDatePast')),
    hora_inicio: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, message('eventTimeFormat')),
    hora_fin: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, message('eventTimeFormat')),
    numero_invitados: z
      .number({ invalid_type_error: message('requiredInvitees') })
      .int(message('integerInvitees'))
      .positive(message('positiveInvitees')),
  })
  .refine((data) => data.hora_inicio < data.hora_fin, {
    message: message('endAfter'),
    path: ['hora_fin'],
  });
export const createReservaEventoFormSchema = buildReservaEventoSchema();

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
