import { z } from 'zod';
import { textosActividades } from '../textos';

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

export const reservaActividadSchema = z
  .object({
    recurso_id: z.number({ required_error: 'Debe seleccionar una instalación deportiva o recreativa' }).min(1),
    fecha: z
      .string({ required_error: 'La fecha es obligatoria' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (AAAA-MM-DD)'),
    hora_inicio: z
      .string({ required_error: 'La hora de inicio es obligatoria' })
      .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Formato de hora inválido (HH:MM)'),
    hora_fin: z
      .string({ required_error: 'La hora de finalización es obligatoria' })
      .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Formato de hora inválido (HH:MM)'),
    instructor_id: z.number().nullable().optional(),
    con_equipo: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      const inicio = timeToMinutes(data.hora_inicio);
      const fin = timeToMinutes(data.hora_fin);
      return inicio < fin;
    },
    {
      message: textosActividades.errorRangoInvalido,
      path: ['hora_fin'],
    }
  )
  .refine(
    (data) => {
      const inicio = timeToMinutes(data.hora_inicio);
      const fin = timeToMinutes(data.hora_fin);
      const duracion = fin - inicio;
      return duracion >= 30 && duracion <= 120;
    },
    {
      message: textosActividades.errorDuracionInvalida,
      path: ['hora_fin'],
    }
  );

export type ReservaActividadFormData = z.infer<typeof reservaActividadSchema>;
