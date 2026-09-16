import { z } from "zod";

const fecha = z.string().refine((value) => {
  const datePart = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) return false;
  const parsedDate = new Date(value);
  if (value.length === 10) {
    return !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.toISOString().slice(0, 10) === datePart;
  }
  return !Number.isNaN(parsedDate.getTime());
}, "La fecha no es válida");

const reservaParqueoFields = {
  reserva_habitacion_id: z.number().int().positive().optional(),
  parqueo_id: z.number().int().positive(),
  fecha_entrada: fecha,
  fecha_salida: fecha.nullable().optional(),
};

export const createReservaParqueoSchema = z
  .object({
    reserva_habitacion_id: reservaParqueoFields.reserva_habitacion_id,
    parqueo_id: reservaParqueoFields.parqueo_id,
    fecha_entrada: reservaParqueoFields.fecha_entrada,
    fecha_salida: reservaParqueoFields.fecha_salida,
  })
  .strict();

export const updateReservaParqueoSchema = z
  .object(reservaParqueoFields)
  .partial()
  .strict();

export const reservaParqueoIdSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d+$/, "El ID debe contener únicamente dígitos")
      .transform(Number)
      .refine((id) => id > 0, "El ID debe ser un número positivo"),
  })
  .strict();
