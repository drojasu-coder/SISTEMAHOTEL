import { z } from "zod";

const tiposDescuento = ["porcentaje", "monto_fijo"] as const;
const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato AAAA-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "La fecha no es válida");

const promocionFields = {
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150),
  tipo_descuento: z.enum(tiposDescuento, {
    message: "El tipo de descuento debe ser porcentaje o monto_fijo",
  }),
  valor_descuento: z.number().finite().nonnegative("El valor no puede ser negativo"),
  aplica_a: z.string().trim().max(50).nullable().optional(),
  fecha_inicio: fecha,
  fecha_fin: fecha,
  activa: z.boolean().optional(),
};

export const createPromocionSchema = z.object(promocionFields).strict().superRefine((data, ctx) => {
  if (data.tipo_descuento === "porcentaje" && data.valor_descuento > 100) {
    ctx.addIssue({ code: "custom", path: ["valor_descuento"], message: "El porcentaje no puede superar 100" });
  }
});

export const updatePromocionSchema = z.object(promocionFields).partial().strict().superRefine((data, ctx) => {
  if (data.tipo_descuento === "porcentaje" && data.valor_descuento !== undefined && data.valor_descuento > 100) {
    ctx.addIssue({ code: "custom", path: ["valor_descuento"], message: "El porcentaje no puede superar 100" });
  }
});

export const promocionIdSchema = z.object({
  id: z.string().regex(/^\d+$/, "El ID debe contener únicamente dígitos").transform(Number)
    .refine((id) => id > 0, "El ID debe ser un número positivo"),
}).strict();
