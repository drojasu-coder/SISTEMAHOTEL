import { z } from "zod";

const proveedorFields = {
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150),
  nit: z.string().trim().max(20).optional().nullable(),
  contacto: z.string().trim().max(150).optional().nullable(),
  telefono: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().email("El email no es válido").max(150).optional().nullable(),
};

export const createProveedorSchema = z.object(proveedorFields).strict();

export const updateProveedorSchema = z
  .object(proveedorFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

export const proveedorIdSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d+$/, "El ID debe contener únicamente dígitos")
      .transform(Number)
      .refine((id) => id > 0, "El ID debe ser un número positivo"),
  })
  .strict();
