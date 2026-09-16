import { z } from "zod";

const positiveId = z.string().regex(/^[1-9]\d*$/, "El id debe ser un entero positivo");
const paymentMethods = ["tarjeta", "efectivo", "transferencia"] as const;
const paymentTypes = ["total", "anticipo", "saldo"] as const;

export const createPagoSchema = z.object({
  carrito_id: z.number().int().positive().nullable().optional(),
  reserva_habitacion_id: z.number().int().positive().nullable().optional(),
  monto: z.union([
    z.number().positive(),
    z.string().regex(/^\d+(\.\d{1,2})?$/, "El monto debe tener hasta dos decimales"),
  ]),
  metodo: z.enum(paymentMethods),
  tipo_pago: z.enum(paymentTypes).optional(),
  moneda: z.literal("GTQ"),
  idempotency_key: z.string().trim().min(1).max(150).nullable().optional(),
}).strict();

export const pagoIdSchema = z.object({ id: positiveId }).strict();

export const pagoQuerySchema = z.object({
  estado: z.enum([
    "pendiente",
    "procesando",
    "aprobado",
    "rechazado",
    "cancelado",
    "reembolsado",
    "reembolsado_parcial",
  ]).optional(),
  metodo: z.enum(paymentMethods).optional(),
  tipo_pago: z.enum(paymentTypes).optional(),
  carrito_id: positiveId.optional(),
  reserva_habitacion_id: positiveId.optional(),
}).strict();

export const resumenPagoQuerySchema = z.object({
  carrito_id: positiveId.optional(),
  reserva_habitacion_id: positiveId.optional(),
}).strict().refine(
  (value) => Boolean(value.carrito_id) !== Boolean(value.reserva_habitacion_id),
  "Debe indicar exactamente un carrito o una reserva de habitación",
);
