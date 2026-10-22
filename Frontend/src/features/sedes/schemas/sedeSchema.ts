import { z } from 'zod';

export const sedeFormSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre de la sede es obligatorio' })
    .trim()
    .min(1, 'El nombre no puede estar vacío')
    .max(150, 'El nombre no puede exceder los 150 caracteres'),
  direccion: z
    .string()
    .trim()
    .max(255, 'La dirección no puede exceder los 255 caracteres')
    .optional()
    .or(z.literal('')),
  ciudad: z
    .string()
    .trim()
    .max(100, 'La ciudad no puede exceder los 100 caracteres')
    .optional()
    .or(z.literal('')),
  telefono: z
    .string()
    .trim()
    .max(20, 'El teléfono no puede exceder los 20 caracteres')
    .optional()
    .or(z.literal('')),
});

export type SedeFormData = z.infer<typeof sedeFormSchema>;

/** Limpia campos vacíos a null antes de enviar al backend */
export function sanitizeSedePayload(data: SedeFormData) {
  return {
    nombre: data.nombre.trim(),
    direccion: data.direccion?.trim() ? data.direccion.trim() : null,
    ciudad: data.ciudad?.trim() ? data.ciudad.trim() : null,
    telefono: data.telefono?.trim() ? data.telefono.trim() : null,
  };
}
