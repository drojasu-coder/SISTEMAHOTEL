import { z } from "zod";
import { ROOM_RESERVATION_STATES } from "./reportes.types";

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !value.startsWith("0000-") && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Indique una fecha válida");
const integer = (maximum: number) => z.string().regex(/^[1-9]\d*$/).transform(Number)
  .refine(value => Number.isSafeInteger(value) && value <= maximum, "Entero fuera del rango permitido");

const reportQuerySchema = z.object({
  desde: calendarDate,
  hasta: calendarDate,
  sucursal_id: integer(2147483647).optional(),
  formato: z.enum(["json", "pdf", "xlsx"]).default("json"),
  pagina: integer(1000000).default(1),
  por_pagina: integer(100).default(20),
}).strict();
const validatePeriod = (value: { desde: string; hasta: string }, context: z.RefinementCtx) => {
  if (value.desde > value.hasta) {
    context.addIssue({ code: "custom", path: ["hasta"], message: "La fecha final debe ser igual o posterior a la inicial" });
  }
  const days = (Date.parse(value.hasta) - Date.parse(value.desde)) / 86400000 + 1;
  if (days > 366) context.addIssue({ code: "custom", path: ["hasta"], message: "Seleccione un período de hasta 366 días" });
};

export const roomReportQuerySchema = reportQuerySchema.extend({ estado: z.enum(ROOM_RESERVATION_STATES).optional() }).superRefine(validatePeriod);

// Same date, pagination, format and unknown-field rules as the existing report.
export const restaurantReportQuerySchema = reportQuerySchema.extend({ estado: z.enum(["confirmada", "cancelada"]).optional() }).superRefine(validatePeriod);
export const activitiesReportQuerySchema = reportQuerySchema.extend({ estado: z.enum(["confirmada", "cancelada", "completada"]).optional() }).superRefine(validatePeriod);
export const eventsReportQuerySchema = reportQuerySchema.extend({ estado: z.enum(["cotizacion", "confirmada", "cancelada", "finalizada"]).optional() }).superRefine(validatePeriod);

export const panoramaQuerySchema = z.object({ desde: calendarDate, hasta: calendarDate, sucursal_id: integer(2147483647).optional() }).strict().superRefine(validatePeriod);
