import { z } from 'zod';

// El backend solo exige que la contraseña no esté vacía al iniciar sesión;
// las reglas de complejidad se aplican únicamente al registrarse.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingrese un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
