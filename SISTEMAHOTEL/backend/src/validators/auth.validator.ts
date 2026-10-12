import {z} from "zod";

export const registerSchema = z
.object({
    nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150, "El nombre no puede superar 150 caracteres"),

    email: z
    .string()
    .trim()
    .email("El correo electrónico no es válido")
    .max(150)
    .transform((email) => email.toLowerCase()),

    password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña es demasiado larga")
    .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),

    telefono: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{8,20}$/, "El número de teléfono no es válido"
    )
    .optional(),
})
.strict();

export const loginSchema = z
.object({
    email: z
    .string()
    .trim()
    .email("El correo electrónico no es válido")
    .transform((email) => email.toLowerCase()),

    password: z
    .string()
    .min(1, "La contraseña es obligatoria"),
})
.strict();