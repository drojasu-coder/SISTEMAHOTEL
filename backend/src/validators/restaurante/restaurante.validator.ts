import { z } from "zod";

export const CATEGORIAS_MENU = ["desayuno", "entrada", "plato_fuerte", "postre", "bebida"] as const;

const precio = z.number().positive("El precio debe ser mayor a 0");

export const listRestaurantesQuerySchema = z
  .object({
    sucursal_id: z.coerce.number().int().positive().optional(),
  })
  .strict();

export const menuQuerySchema = z
  .object({
    categoria: z.enum(CATEGORIAS_MENU).optional(),
    // Permite al cliente ver la carta completa marcando lo que hoy no se ofrece.
    incluir_no_disponibles: z.enum(["true", "false"]).optional(),
  })
  .strict();

export const productoIdParamSchema = z
  .object({
    productoId: z.string().regex(/^[1-9]\d*$/, "El id debe ser un número entero positivo"),
  })
  .strict();

export const createProductoMenuSchema = z
  .object({
    categoria: z.enum(CATEGORIAS_MENU),
    nombre: z.string().trim().min(1).max(120),
    descripcion: z.string().trim().max(1000).nullable().optional(),
    precio,
    disponible: z.boolean().optional(),
    orden: z.number().int().nonnegative().optional(),
  })
  .strict();

export const updateProductoMenuSchema = z
  .object({
    categoria: z.enum(CATEGORIAS_MENU).optional(),
    nombre: z.string().trim().min(1).max(120).optional(),
    descripcion: z.string().trim().max(1000).nullable().optional(),
    precio: precio.optional(),
    disponible: z.boolean().optional(),
    orden: z.number().int().nonnegative().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });
