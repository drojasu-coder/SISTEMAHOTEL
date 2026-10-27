import { normalizePhone } from '../telephone';
import { extraEs, type ExtraKey } from '@/i18n/publicExtra';
import { z } from 'zod';

// Refleja las reglas de backend/src/validators/auth.validator.ts para dar
// retroalimentación inmediata. La validación definitiva sigue siendo del servidor.
export const createRegisterSchema = (message: (key: ExtraKey) => string = (key) => extraEs[key], callingCode = '') => z.object({
  nombre: z
    .string()
    .trim()
    .min(2, message('nameMin'))
    .max(150, message('nameMax')),
  email: z
    .string()
    .trim()
    .min(1, message('requiredEmail'))
    .email(message('validEmail'))
    .max(150, message('emailMax')),
  telefono: z
    .string()
    .trim()
    .transform((value) => normalizePhone(value, callingCode))
    .refine((value) => value === '' || /^[0-9+\-\s()]{8,20}$/.test(value), {
      message: message('validPhone'),
    }),
  password: z
    .string()
    .min(8, message('passwordMin'))
    .max(72, message('passwordMax'))
    .regex(/[A-Z]/, message('passwordUpper'))
    .regex(/[a-z]/, message('passwordLower'))
    .regex(/[0-9]/, message('passwordNumber')),
});
export const registerSchema = createRegisterSchema();

export type RegisterFormData = z.infer<typeof registerSchema>;
