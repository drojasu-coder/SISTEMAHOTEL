import { z } from 'zod';

// Refleja las reglas de backend/src/validators/auth.validator.ts para dar
// retroalimentación inmediata. La validación definitiva sigue siendo del servidor.
export const registerSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede superar 150 caracteres'),
  email: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingrese un correo electrónico válido')
    .max(150, 'El correo no puede superar 150 caracteres'),
  telefono: z
    .string()
    .trim()
    .refine((value) => value === '' || /^[0-9+\-\s()]{8,20}$/.test(value), {
      message: 'Ingrese un número de teléfono válido (8 a 20 dígitos)',
    }),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña es demasiado larga')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
