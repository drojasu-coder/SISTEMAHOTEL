import { z } from "zod";
import { PAYMENT_CURRENCY, PAYMENT_METHODS, PAYMENT_TYPES } from "../../constants/payments";

const positiveId = z.string().regex(/^[1-9]\d*$/, "El id debe ser un entero positivo");

export const createPagoSchema = z.object({
  carrito_id: z.number().int().positive().nullable().optional(),
  reserva_habitacion_id: z.number().int().positive().nullable().optional(),
  monto: z.union([
    z.number().positive(),
    z.string().regex(/^\d+(\.\d{1,2})?$/, "El monto debe tener hasta dos decimales"),
  ]),
  metodo: z.enum(PAYMENT_METHODS),
  tipo_pago: z.enum(PAYMENT_TYPES).optional(),
  moneda: z.literal(PAYMENT_CURRENCY),
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
  metodo: z.enum(PAYMENT_METHODS).optional(),
  tipo_pago: z.enum(PAYMENT_TYPES).optional(),
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

export const intentoActivoQuerySchema = z.object({
  carrito_id: positiveId.optional(),
  reserva_habitacion_id: positiveId.optional(),
}).strict().refine(
  (value) => Boolean(value.carrito_id) !== Boolean(value.reserva_habitacion_id),
  "Debe indicar exactamente un carrito o una reserva de habitación",
);

export const createReembolsoSchema = z.object({
  monto: z.union([
    z.number().positive(),
    z.string().regex(/^\d+(\.\d{1,2})?$/, "El monto debe tener hasta dos decimales"),
  ]),
  motivo: z.string().trim().min(1).max(255).optional(),
  idempotency_key: z.string().trim().min(1).max(150),
}).strict();
