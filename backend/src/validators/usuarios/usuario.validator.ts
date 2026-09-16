import { z } from "zod";

import { ROLES, Role } from "../../constants/roles";

const roleValues = Object.values(ROLES) as [
  Role,
  ...Role[]
];

const telefonoSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9+\-\s()]{8,20}$/,
    "El teléfono no tiene un formato válido"
  );

export const createUsuarioAdminSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(150),

    email: z
      .string()
      .trim()
      .email("El correo electrónico no es válido")
      .max(150)
      .transform((email) => email.toLowerCase()),

    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72)
      .regex(
        /[A-Z]/,
        "Debe contener al menos una letra mayúscula"
      )
      .regex(
        /[a-z]/,
        "Debe contener al menos una letra minúscula"
      )
      .regex(
        /[0-9]/,
        "Debe contener al menos un número"
      ),

    rol: z.enum(roleValues, {
      error: "El rol indicado no es válido",
    }),

    telefono: telefonoSchema
      .optional()
      .nullable(),
  })
  .strict();

export const updateUsuarioSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2)
      .max(150)
      .optional(),

    email: z
      .string()
      .trim()
      .email("El correo electrónico no es válido")
      .max(150)
      .transform((email) => email.toLowerCase())
      .optional(),

    telefono: telefonoSchema
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message:
        "Debe enviar al menos un campo para actualizar",
    }
  );

export const updateUsuarioRolSchema = z
  .object({
    rol: z.enum(roleValues, {
      error: "El rol indicado no es válido",
    }),
  })
  .strict();

export const updateUsuarioEstadoSchema = z
  .object({
    activo: z.boolean(),
  })
  .strict();