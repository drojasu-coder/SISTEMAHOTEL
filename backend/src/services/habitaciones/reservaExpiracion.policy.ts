import { QueryTypes } from "sequelize";
import { env } from "../../config/env";

const { sequelize } = require("../../models");

/**
 * Política de vencimiento de reservas de habitación pendientes.
 *
 * Solo las reservas creadas con la política activa reciben expira_en; las anteriores
 * conservan NULL y nunca son elegibles. Este módulo no depende del servicio de pagos
 * para poder usarse desde la creación de reservas sin dependencias circulares.
 */
export const isExpirationPolicyEnabled = () => env.RESERVA_PENDIENTE_EXPIRACION_ACTIVA === true;

let columnKnown: boolean | undefined;
/** La columna expira_en la añade una migración aditiva; sin ella la política queda inerte. */
export const hasExpirationColumn = async (): Promise<boolean> => {
  if (columnKnown) return true;
  const [row] = await sequelize.query(
    `SELECT 1 AS ok FROM information_schema.columns
      WHERE table_name = 'reservas_habitacion' AND column_name = 'expira_en' AND table_schema = current_schema()`,
    { type: QueryTypes.SELECT },
  ) as Array<{ ok: number }>;
  columnKnown = Boolean(row);
  return columnKnown;
};

export const computeExpiration = (from: Date = new Date()) =>
  new Date(from.getTime() + env.RESERVA_PENDIENTE_TTL_MINUTOS * 60_000);

/**
 * Se invoca dentro de la transacción de creación. Con la política apagada o sin la
 * columna no hace nada, de modo que el flujo actual no cambia.
 */
export const stampPendingReservationExpiration = async (reservationId: number, transaction: unknown) => {
  if (!isExpirationPolicyEnabled() || !(await hasExpirationColumn())) return null;
  const expiresAt = computeExpiration();
  await sequelize.query(
    `UPDATE reservas_habitacion SET expira_en = :expiresAt WHERE id = :id AND estado = 'pendiente' AND expira_en IS NULL`,
    { replacements: { expiresAt, id: reservationId }, transaction },
  );
  return expiresAt;
};

export interface PaymentSnapshot {
  id: number;
  estado: string;
  metodo: string;
  id_transaccion_externo: string | null;
  updatedAt: Date | string;
  carrito_expirado: boolean;
}
export type ExposureDecision =
  | { accion: "expirar" }
  | { accion: "omitir"; motivo: "pago_aprobado" | "pago_en_gracia" | "pago_sin_referencia_stripe" | "transferencia_pendiente" | "carrito_vigente" | "pago_estado_desconocido" }
  | { accion: "conciliar"; pagos: number[] };

/** Un rechazo de tarjeta no invalida el intento. Tampoco un cierre local sin referencia prueba cancelación en Stripe. */
export const isUncertainReservationPayment = (payment: {
  estado: string; metodo: string; id_transaccion_externo?: string | null;
}): boolean => {
  if (["aprobado", "reembolsado", "reembolsado_parcial"].includes(payment.estado)) return false;
  if (payment.estado === "cancelado") return payment.metodo === "tarjeta" && !payment.id_transaccion_externo;
  if (payment.estado === "rechazado") return payment.metodo === "tarjeta";
  return true;
};

const SETTLED_POSITIVE = new Set(["aprobado", "reembolsado_parcial", "reembolsado"]);

/**
 * Decisión pura (sin acceso a datos) sobre los pagos relacionados con una reserva vencida.
 * - Un pago aprobado o reembolsado jamás permite liberar la reserva.
 * - Un pago "procesando" NO se interpreta como cobro ni como fallo: primero se concilia con Stripe,
 *   y solo cuando supera el período de gracia y su carrito ya venció.
 * - Rechazos de tarjeta y cierres sin referencia conservan el bloqueo hasta su revisión.
 */
export const decideExpiration = (payments: PaymentSnapshot[], graceMinutes: number, now: Date = new Date()): ExposureDecision => {
  if (payments.some(p => SETTLED_POSITIVE.has(p.estado))) return { accion: "omitir", motivo: "pago_aprobado" };
  const open = payments.filter(isUncertainReservationPayment);
  if (open.length === 0) return { accion: "expirar" };
  const toReconcile: number[] = [];
  for (const p of open) {
    if (p.estado === "pendiente") return { accion: "omitir", motivo: "transferencia_pendiente" };
    if (p.estado !== "procesando") return { accion: "omitir", motivo: "pago_estado_desconocido" };
    if (p.metodo !== "tarjeta") return { accion: "omitir", motivo: "pago_sin_referencia_stripe" };
    // Tarjeta sin referencia local: solo se concilia (buscándola en Stripe) cuando ya superó la gracia y su carrito venció.
    const age = now.getTime() - new Date(p.updatedAt).getTime();
    if (age < graceMinutes * 60_000) return { accion: "omitir", motivo: "pago_en_gracia" };
    if (!p.carrito_expirado) return { accion: "omitir", motivo: "carrito_vigente" };
    toReconcile.push(p.id);
  }
  return { accion: "conciliar", pagos: toReconcile };
};

/**
 * Plazo de pago vencido de una reserva concreta. Solo aplica a reservas que llevan expira_en (creadas con la política
 * activa): las históricas (NULL) y cualquier base sin la columna nunca se consideran vencidas por este criterio.
 */
export const isReservationPastPaymentDeadline = async (reservationId: number, transaction: unknown, now: Date = new Date()): Promise<boolean> => {
  if (!(await hasExpirationColumn())) return false;
  const [row] = await sequelize.query(
    `SELECT expira_en FROM reservas_habitacion WHERE id = :id AND estado = 'pendiente' AND expira_en IS NOT NULL`,
    { replacements: { id: reservationId }, type: QueryTypes.SELECT, transaction },
  ) as Array<{ expira_en: Date }>;
  return Boolean(row && new Date(row.expira_en).getTime() <= now.getTime());
};

/** Límite de pago almacenado de una reserva pendiente; null si no lo tiene (histórica, política apagada o sin columna). */
export const getReservationPaymentDeadline = async (reservationId: number, transaction: unknown): Promise<Date | null> => {
  if (!(await hasExpirationColumn())) return null;
  const [row] = await sequelize.query(
    `SELECT expira_en FROM reservas_habitacion WHERE id = :id AND estado = 'pendiente'`,
    { replacements: { id: reservationId }, type: QueryTypes.SELECT, transaction },
  ) as Array<{ expira_en: Date | null }>;
  return row?.expira_en ? new Date(row.expira_en) : null;
};

/**
 * Una estancia cuya salida es hoy o ya pasó (fecha del hotel) no puede pagarse en línea: no hay noches por vender.
 * No cambia el estado de la reserva ni borra nada; solo impide iniciar pagos nuevos sobre ella.
 */
export const isStayEnded = (fechaSalida: string | Date, now: Date = new Date()): boolean => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: env.APP_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const exit = typeof fechaSalida === "string" ? fechaSalida.slice(0, 10) : fechaSalida.toISOString().slice(0, 10);
  return exit <= today;
};
