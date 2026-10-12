import { z } from "zod";

const proveedorProductoFields = {
  proveedor_id: z
    .number()
    .int()
    .positive("El proveedor debe ser un ID positivo"),
  nombre_producto: z
    .string()
    .trim()
    .min(1, "El nombre del producto es obligatorio")
    .max(150),
  descripcion: z.string().trim().nullable().optional(),
};

export const createProveedorProductoSchema = z
  .object(proveedorProductoFields)
  .strict();

export const updateProveedorProductoSchema = z
  .object(proveedorProductoFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

export const proveedorProductoIdSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d+$/, "El ID debe contener únicamente dígitos")
      .transform(Number)
      .refine((id) => id > 0, "El ID debe ser un número positivo"),
  })
  .strict();
