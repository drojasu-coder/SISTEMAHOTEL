import { extraEs, type ExtraKey } from '@/i18n/publicExtra';
import { z } from 'zod';

// El backend solo exige que la contraseña no esté vacía al iniciar sesión;
// las reglas de complejidad se aplican únicamente al registrarse.
export const createLoginSchema = (message: (key: ExtraKey) => string = (key) => extraEs[key]) => z.object({
  email: z
    .string()
    .trim()
    .min(1, message('requiredEmail'))
    .email(message('validEmail')),
  password: z.string().min(1, message('requiredPassword')),
});
export const loginSchema = createLoginSchema();

export type LoginFormData = z.infer<typeof loginSchema>;
