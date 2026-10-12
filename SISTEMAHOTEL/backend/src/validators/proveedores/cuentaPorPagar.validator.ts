import { z } from "zod";

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato AAAA-MM-DD")
  .refine((value) => {
    const parsedDate = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.toISOString().slice(0, 10) === value
    );
  }, "La fecha no es válida");

const cuentaPorPagarFields = {
  proveedor_id: z
    .number()
    .int()
    .positive("El proveedor debe ser un ID positivo"),
  monto: z
    .number()
    .finite("El monto debe ser un número válido")
    .nonnegative("El monto no puede ser negativo"),
  fecha_vencimiento: fecha,
  estado: z.enum(["pendiente", "pagado", "vencido"]),
  factura_referencia: z.string().trim().max(100).nullable().optional(),
};

export const createCuentaPorPagarSchema = z
  .object({
    proveedor_id: cuentaPorPagarFields.proveedor_id,
    monto: cuentaPorPagarFields.monto,
    fecha_vencimiento: cuentaPorPagarFields.fecha_vencimiento,
    estado: cuentaPorPagarFields.estado.optional(),
    factura_referencia: cuentaPorPagarFields.factura_referencia,
  })
  .strict();

export const updateCuentaPorPagarSchema = z
  .object(cuentaPorPagarFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

export const cuentaPorPagarIdSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d+$/, "El ID debe contener únicamente dígitos")
      .transform(Number)
      .refine((id) => id > 0, "El ID debe ser un número positivo"),
  })
  .strict();
