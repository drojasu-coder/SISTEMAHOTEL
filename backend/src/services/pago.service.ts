import { AppError } from "../utils/AppError";
import { stripeService, toStripeAmount } from "./stripe.service";
import { isReservationPastPaymentDeadline, isStayEnded, isUncertainReservationPayment } from "./habitaciones/reservaExpiracion.policy";
import Stripe from "stripe";
import { Op } from "sequelize";
import { env } from "../config/env";
import {
  PAYMENT_CURRENCY,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  PaymentMethod,
  PaymentType,
} from "../constants/payments";
import {
  assertPaymentOriginOwnership,
  assertPaymentOwnership,
  isPaymentAdministrator,
  RequesterContext,
} from "../utils/paymentOwnership";
import { ROLES, Role } from "../constants/roles";
import { SedeScope, assertSedeAccess } from "../utils/sedeScope";

const db = require("../models");
const {
  sequelize,
  Pago,
  Carrito,
  CarritoItem,
  ReservaHabitacion,
  ReservaEvento,
  ReservaActividad,
  CitaBienestar,
  ServicioBienestar,
} = db;

export type PagoMetodo = PaymentMethod;
export type PagoTipo = PaymentType;

export interface CreatePagoData {
  carrito_id?: number;
  reserva_habitacion_id?: number;
  monto: number | string;
  metodo: PagoMetodo;
  tipo_pago?: PagoTipo;
  moneda?: string;
  idempotency_key?: string;
}

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const toCents = (value: unknown) => Math.round(Number(value) * 100);

/**
 * Distribuye un monto de carrito entre todos sus items usando exclusivamente
 * sus snapshots persistidos. El calculo se mantiene en centavos y entrega como
 * maximo un centavo residual por item. Eventos usan el orden de CarritoItem.id;
 * habitaciones conservan su estrategia historica de mayor residuo proporcional.
 */
const allocateCartAmountToReferenceCents = async (
  carritoId: number,
  amountCents: number,
  tipoItem: string,
  referenciaId: number,
  transaction: any,
  residualByItemId = false,
) => {
  if (amountCents <= 0) return 0;

  const items = await CarritoItem.findAll({
    where: { carrito_id: carritoId },
    attributes: [
      "id",
      "tipo_item",
      "referencia_id",
      "precio",
      "cantidad",
    ],
    order: [["id", "ASC"]],
    transaction,
  });
  const weightedItems = (items as any[])
    .map((item: any) => ({
      id: Number(item.id),
      isTarget:
        String(item.tipo_item) === tipoItem &&
        Number(item.referencia_id) === Number(referenciaId),
      weight: Math.max(
        0,
        toCents(Number(item.precio) * Number(item.cantidad)),
      ),
    }))
    .filter((item: any) => item.weight > 0)
    .sort((left: any, right: any) => left.id - right.id);
  const totalWeight = weightedItems.reduce(
    (sum: number, item: any) => sum + item.weight,
    0,
  );
  if (totalWeight <= 0) return 0;

  const totalWeightBigInt = BigInt(totalWeight);
  const shares = weightedItems.map((item: any) => {
    const numerator = BigInt(amountCents) * BigInt(item.weight);
    return {
      ...item,
      cents: Number(numerator / totalWeightBigInt),
      remainder: numerator % totalWeightBigInt,
    };
  });
  let undistributed = amountCents - shares.reduce(
    (sum: number, share: any) => sum + share.cents,
    0,
  );
  if (!residualByItemId) {
    shares.sort((left: any, right: any) => {
      if (left.remainder === right.remainder) return left.id - right.id;
      return left.remainder > right.remainder ? -1 : 1;
    });
  }
  for (let index = 0; index < shares.length && undistributed > 0; index += 1) {
    shares[index].cents += 1;
    undistributed -= 1;
  }

  return shares
    .filter((share: any) => share.isTarget)
    .reduce((sum: number, share: any) => sum + share.cents, 0);
};

const money = (value: unknown, field = "monto") => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || !/^\d+(\.\d{1,2})?$/.test(String(value))) {
    throw new AppError(422, "INVALID_PAYMENT_AMOUNT", `${field} debe ser un monto positivo con hasta dos decimales`);
  }
  return round(amount);
};

const failOrigin = () =>
  new AppError(422, "INVALID_PAYMENT_ORIGIN", "Debe indicar exactamente un carrito o una reserva de habitación");

const validateOrigin = (data: CreatePagoData) => {
  const hasCart = data.carrito_id !== undefined && data.carrito_id !== null;
  const hasReservation =
    data.reserva_habitacion_id !== undefined && data.reserva_habitacion_id !== null;
  if (hasCart === hasReservation) throw failOrigin();
  const id = hasCart ? data.carrito_id : data.reserva_habitacion_id;
  if (!Number.isInteger(id) || Number(id) <= 0) {
    throw new AppError(422, "INVALID_PAYMENT_ORIGIN", "El identificador del origen debe ser un entero positivo");
  }
};

const terminal = new Set(["cancelada", "cancelado", "expirada", "expirado", "finalizada", "completada", "pagado"]);
const payableRoomStates = new Set(["pendiente", "confirmada"]);
const payableEventStates = new Set(["cotizacion", "confirmada"]);

const approvedAmount = async (where: Record<string, unknown>, transaction: any) => {
  const payments = await Pago.findAll({
    where: { ...where, estado: { [Op.in]: ["aprobado", "reembolsado_parcial", "reembolsado"] } },
    attributes: ["id", "monto"],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  let sum = 0;
  for (const payment of payments) {
    const refunds = await db.Reembolso.findAll({
      where: { pago_id: payment.id, estado: "aprobado" },
      attributes: ["monto"],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const refunded = refunds.reduce((acc: number, r: any) => acc + Number(r.monto), 0);
    sum += Math.max(0, Number(payment.monto) - refunded);
  }
  return round(sum);
};

const approvedCartAmount = (carritoId: number, transaction: any) =>
  approvedAmount({ carrito_id: carritoId }, transaction);

const committedOrProcessingExposure = async (
  where: Record<string, unknown>,
  transaction: any,
) => {
  const approved = await approvedAmount(where, transaction);
  const processingPayments = await Pago.findAll({
    where: { ...where, estado: "procesando" },
    attributes: ["monto"],
    transaction,
  });
  const processing = processingPayments.reduce(
    (sum: number, payment: any) => sum + Number(payment.monto),
    0,
  );
  return { approved, total: round(approved + processing) };
};

const historicalCartIdsForReference = async (
  tipoItem: string,
  referenciaId: number,
  transaction: any,
) => {
  const historicalItems = await CarritoItem.findAll({
    where: {
      tipo_item: tipoItem,
      referencia_id: referenciaId,
    },
    attributes: ["carrito_id"],
    transaction,
  });

  return [
    ...new Set<number>(
      (historicalItems as any[]).map((item: any) =>
        Number(item.carrito_id),
      ),
    ),
  ];
};

/**
 * Exposición procesando de una referencia en todos los carritos que histórica
 * o actualmente la contienen. Los estados terminales del carrito no eliminan
 * un Pago que todavía puede completarse externamente.
 */
export const cartReferenceProcessingExposure = async (
  tipoItem: string,
  referenciaId: number,
  transaction: any,
) => {
  const cartIds = await historicalCartIdsForReference(
    tipoItem,
    referenciaId,
    transaction,
  );

  if (cartIds.length === 0) return 0;

  const processingPayments = await Pago.findAll({
    where: {
      carrito_id: { [Op.in]: cartIds },
      estado: "procesando",
    },
    attributes: ["monto"],
    transaction,
  });

  return round(
    processingPayments.reduce(
      (sum: number, payment: any) => sum + Number(payment.monto),
      0,
    ),
  );
};

/**
 * Exposición financiera activa de una ReservaHabitacion, sin importar si el
 * pago nació directamente de la reserva o de cualquiera de los carritos que
 * histórica o actualmente contienen la referencia.
 *
 * La fila de ReservaHabitacion es el lock canónico de quienes pueden aumentar
 * esta exposición. Por eso esta lectura no toma locks Pago: createPago y
 * approveTransferencia deben bloquear primero la reserva y calcular dentro de
 * la misma transacción. Los pagos se seleccionan una sola vez mediante OR,
 * incluso ante datos heredados donde ambas llaves de origen estuvieran llenas.
 */
export const reservationFinancialExposure = async (
  reservationId: number,
  transaction: any,
) => {
  const cartIds = await historicalCartIdsForReference(
    "habitacion",
    reservationId,
    transaction,
  );
  const origins: Record<string | symbol, unknown>[] = [
    { reserva_habitacion_id: reservationId },
  ];
  if (cartIds.length > 0) {
    origins.push({ carrito_id: { [Op.in]: cartIds } });
  }

  const payments = await Pago.findAll({
    where: {
      [Op.or]: origins,
    },
    attributes: [
      "id",
      "monto",
      "estado",
      "metodo",
      "id_transaccion_externo",
      "carrito_id",
      "reserva_habitacion_id",
    ],
    transaction,
  });
  const uniquePayments = [
    ...new Map<number, any>(
      (payments as any[]).map((payment: any) => [
        Number(payment.id),
        payment,
      ]),
    ).values(),
  ];
  const approvedPayments = uniquePayments.filter((payment: any) =>
    ["aprobado", "reembolsado_parcial", "reembolsado"].includes(
      String(payment.estado),
    ),
  );
  const refunds = approvedPayments.length > 0
    ? await db.Reembolso.findAll({
        where: {
          pago_id: {
            [Op.in]: approvedPayments.map((payment: any) => payment.id),
          },
          estado: "aprobado",
        },
        attributes: ["pago_id", "monto"],
        transaction,
      })
    : [];
  const refundedByPayment = new Map<number, number>();
  for (const refund of refunds as any[]) {
    const paymentId = Number(refund.pago_id);
    refundedByPayment.set(
      paymentId,
      round(
        (refundedByPayment.get(paymentId) ?? 0) + Number(refund.monto),
      ),
    );
  }

  const allocateCartCents = async (
    carritoId: number,
    amountCents: number,
  ) => allocateCartAmountToReferenceCents(
    carritoId,
    amountCents,
    "habitacion",
    reservationId,
    transaction,
  );

  let approvedCents = 0;
  let processingCents = 0;
  const cartApprovedCents = new Map<number, number>();
  const cartProcessingCents = new Map<number, number>();
  for (const payment of uniquePayments as any[]) {
    const directReservationId = payment.reserva_habitacion_id == null
      ? null
      : Number(payment.reserva_habitacion_id);
    const isApproved = [
      "aprobado",
      "reembolsado_parcial",
      "reembolsado",
    ].includes(String(payment.estado));
    // Los rechazos de tarjeta heredados y cierres sin referencia también
    // reservan capacidad: no pueden permitir otro cobro ni liberar la habitación.
    const isProcessing = payment.estado === "procesando" ||
      (payment.metodo === "tarjeta" && isUncertainReservationPayment(payment));
    const paymentCents = isApproved
      ? Math.max(
          0,
          toCents(payment.monto) -
            toCents(refundedByPayment.get(Number(payment.id)) ?? 0),
        )
      : isProcessing
        ? toCents(payment.monto)
        : 0;

    // Ante datos heredados con ambas llaves, el origen directo tiene
    // precedencia para que un mismo Pago nunca se atribuya dos veces.
    if (directReservationId !== null) {
      if (directReservationId === Number(reservationId)) {
        if (isApproved) approvedCents += paymentCents;
        if (isProcessing) processingCents += paymentCents;
      }
      continue;
    }

    const carritoId = payment.carrito_id == null
      ? null
      : Number(payment.carrito_id);
    if (carritoId === null) continue;
    const targetMap = isApproved ? cartApprovedCents : cartProcessingCents;
    targetMap.set(carritoId, (targetMap.get(carritoId) ?? 0) + paymentCents);
  }

  for (const [carritoId, amountCents] of cartApprovedCents) {
    approvedCents += await allocateCartCents(carritoId, amountCents);
  }
  for (const [carritoId, amountCents] of cartProcessingCents) {
    processingCents += await allocateCartCents(carritoId, amountCents);
  }

  const approved = round(approvedCents / 100);
  const processing = round(processingCents / 100);

  return {
    approved,
    processing,
    total: round(approved + processing),
  };
};

/**
 * Exposición financiera activa de una ReservaEvento a través de todos los
 * carritos que histórica o actualmente contienen la referencia.
 *
 * La fila de ReservaEvento es el lock canónico de quienes pueden aumentar
 * esta exposición. Cada Pago se cuenta una sola vez, los pagos procesando se
 * comprometen completos y únicamente los reembolsos aprobados reducen dinero
 * aprobado.
 */
export const eventFinancialExposure = async (
  reservationId: number,
  transaction: any,
) => {
  const cartIds = await historicalCartIdsForReference(
    "evento",
    reservationId,
    transaction,
  );

  if (cartIds.length === 0) {
    return { approved: 0, processing: 0, total: 0 };
  }

  const payments = await Pago.findAll({
    where: {
      carrito_id: { [Op.in]: cartIds },
      estado: {
        [Op.in]: [
          "aprobado",
          "reembolsado_parcial",
          "reembolsado",
          "procesando",
        ],
      },
    },
    attributes: ["id", "monto", "estado", "carrito_id"],
    transaction,
  });
  const uniquePayments = [
    ...new Map<number, any>(
      (payments as any[]).map((payment: any) => [
        Number(payment.id),
        payment,
      ]),
    ).values(),
  ];
  const approvedPayments = uniquePayments.filter((payment: any) =>
    ["aprobado", "reembolsado_parcial", "reembolsado"].includes(
      String(payment.estado),
    ),
  );
  const refunds = approvedPayments.length > 0
    ? await db.Reembolso.findAll({
        where: {
          pago_id: {
            [Op.in]: approvedPayments.map((payment: any) => payment.id),
          },
          estado: "aprobado",
        },
        attributes: ["pago_id", "monto"],
        transaction,
      })
    : [];
  const refundedByPayment = new Map<number, number>();
  for (const refund of refunds as any[]) {
    const paymentId = Number(refund.pago_id);
    refundedByPayment.set(
      paymentId,
      round(
        (refundedByPayment.get(paymentId) ?? 0) + Number(refund.monto),
      ),
    );
  }

  let approvedCents = 0;
  let processingCents = 0;
  for (const payment of uniquePayments as any[]) {
    const paymentCents = toCents(payment.monto);
    const carritoId = Number(payment.carrito_id);
    if (payment.estado === "procesando") {
      processingCents += await allocateCartAmountToReferenceCents(
        carritoId,
        paymentCents,
        "evento",
        reservationId,
        transaction,
        true,
      );
      continue;
    }

    const approvedNetCents = Math.max(
      0,
      paymentCents -
        toCents(refundedByPayment.get(Number(payment.id)) ?? 0),
    );
    approvedCents += await allocateCartAmountToReferenceCents(
      carritoId,
      approvedNetCents,
      "evento",
      reservationId,
      transaction,
      true,
    );
  }

  const approved = round(approvedCents / 100);
  const processing = round(processingCents / 100);
  return {
    approved,
    processing,
    total: round(approved + processing),
  };
};

/**
 * Exposición financiera activa de una CitaBienestar a través de todos los
 * carritos que histórica o actualmente contienen la referencia.
 *
 * Cada Pago se cuenta una sola vez, los pagos procesando se comprometen
 * completos y únicamente los reembolsos aprobados reducen dinero aprobado.
 */
export const wellnessFinancialExposure = async (
  citaId: number,
  transaction: any,
  excludePaymentId?: number,
) => {
  const cartIds = await historicalCartIdsForReference(
    "bienestar",
    citaId,
    transaction,
  );

  if (cartIds.length === 0) {
    return { approved: 0, processing: 0, total: 0 };
  }

  const whereClause: Record<string, unknown> = {
    carrito_id: { [Op.in]: cartIds },
    estado: {
      [Op.in]: [
        "aprobado",
        "reembolsado_parcial",
        "reembolsado",
        "procesando",
      ],
    },
  };
  if (excludePaymentId) {
    whereClause.id = { [Op.ne]: excludePaymentId };
  }

  const payments = await Pago.findAll({
    where: whereClause,
    attributes: ["id", "monto", "estado", "carrito_id"],
    transaction,
  });
  const uniquePayments = [
    ...new Map<number, any>(
      (payments as any[]).map((payment: any) => [
        Number(payment.id),
        payment,
      ]),
    ).values(),
  ];
  const approvedPayments = uniquePayments.filter((payment: any) =>
    ["aprobado", "reembolsado_parcial", "reembolsado"].includes(
      String(payment.estado),
    ),
  );
  const refunds = approvedPayments.length > 0
    ? await db.Reembolso.findAll({
        where: {
          pago_id: {
            [Op.in]: approvedPayments.map((payment: any) => payment.id),
          },
          estado: "aprobado",
        },
        attributes: ["pago_id", "monto"],
        transaction,
      })
    : [];
  const refundedByPayment = new Map<number, number>();
  for (const refund of refunds as any[]) {
    const paymentId = Number(refund.pago_id);
    refundedByPayment.set(
      paymentId,
      round(
        (refundedByPayment.get(paymentId) ?? 0) + Number(refund.monto),
      ),
    );
  }

  let approvedCents = 0;
  let processingCents = 0;
  for (const payment of uniquePayments as any[]) {
    const paymentCents = toCents(payment.monto);
    const carritoId = Number(payment.carrito_id);
    if (payment.estado === "procesando") {
      processingCents += await allocateCartAmountToReferenceCents(
        carritoId,
        paymentCents,
        "bienestar",
        citaId,
        transaction,
        true,
      );
      continue;
    }

    const approvedNetCents = Math.max(
      0,
      paymentCents -
        toCents(refundedByPayment.get(Number(payment.id)) ?? 0),
    );
    approvedCents += await allocateCartAmountToReferenceCents(
      carritoId,
      approvedNetCents,
      "bienestar",
      citaId,
      transaction,
      true,
    );
  }

  const approved = round(approvedCents / 100);
  const processing = round(processingCents / 100);
  return {
    approved,
    processing,
    total: round(approved + processing),
  };
};


/**
 * Comprueba si una referencia genérica que estuvo en un carrito
 * anterior ya quedó completamente pagada.
 *
 * La referencia se considera pagada únicamente cuando alguno de los
 * carritos históricos que la contuvo quedó cubierto completamente por
 * pagos aprobados netos de reembolsos.
 *
 * No intentamos asignar pagos parciales a ítems concretos.
 */
export const isCartReferenceFullyPaid = async (
  tipoItem: string,
  referenciaId: number,
  transaction: any,
) => {
  const cartIds = await historicalCartIdsForReference(
    tipoItem,
    referenciaId,
    transaction,
  );

  for (const carritoId of cartIds) {
    const items = await CarritoItem.findAll({
      where: { carrito_id: carritoId },
      attributes: ["precio", "cantidad"],
      transaction,
    });

    if (items.length === 0) {
      continue;
    }

    const cartTotal = round(
      (items as any[]).reduce(
        (total: number, item: any) =>
          total + Number(item.precio) * Number(item.cantidad),
        0,
      ),
    );

    if (cartTotal <= 0) {
      continue;
    }

    const approved = Number(
      await approvedCartAmount(carritoId, transaction),
    );

    if (approved >= cartTotal) {
      return true;
    }
  }

  return false;
};

/**
 * Comprueba si una referencia genérica ya tiene
 * dinero neto aprobado en alguno de los carritos
 * históricos donde estuvo incluida.
 *
 * A diferencia de isCartReferenceFullyPaid(),
 * aquí NO exigimos que el carrito haya quedado
 * completamente cubierto.
 *
 * Cualquier monto neto aprobado > 0 significa
 * que la referencia ya tiene un compromiso
 * financiero previo y no debe duplicarse en
 * otro carrito.
 *
 * approvedCartAmount() ya descuenta reembolsos
 * aprobados, por lo que un reembolso total
 * vuelve a dejar el monto neto en cero.
 */
export const hasCartReferenceApprovedPayment =
  async (
    tipoItem: string,
    referenciaId: number,
    transaction: any
  ) => {
    const cartIds =
      await historicalCartIdsForReference(
        tipoItem,
        referenciaId,
        transaction,
      );

    for (
      const carritoId of
      cartIds
    ) {
      const approved =
        Number(
          await approvedCartAmount(
            carritoId,
            transaction
          )
        );

      /**
       * approvedCartAmount() devuelve el
       * valor neto:
       *
       * pagos aprobados - reembolsos aprobados.
       */
      if (
        approved > 0
      ) {
        return true;
      }
    }

    return false;
  };

/**
 * Comprueba si una referencia tiene exposición financiera activa en
 * cualquiera de los carritos históricos donde estuvo incluida.
 *
 * La exposición activa incluye dinero aprobado neto de reembolsos y pagos
 * en estado procesando. Estos últimos no se convierten en dinero aprobado:
 * solo reservan capacidad financiera mientras pueden completarse.
 */
export const hasCartReferenceActiveFinancialCommitment = async (
  tipoItem: string,
  referenciaId: number,
  transaction: any,
) => {
  const cartIds = await historicalCartIdsForReference(
    tipoItem,
    referenciaId,
    transaction,
  );

  for (const carritoId of cartIds) {
    const exposure = await committedOrProcessingExposure(
      { carrito_id: carritoId },
      transaction,
    );

    if (exposure.total > 0) {
      return true;
    }
  }

  return false;
};

export const assertEventReservationCanBeMutated = async (
  reservaId: number,
  transaction: any,
  actionMessage?: string,
) => {
  const cartIds = await historicalCartIdsForReference(
    "evento",
    reservaId,
    transaction,
  );

  if (cartIds.length === 0) {
    return;
  }

  const payments = await Pago.findAll({
    where: {
      carrito_id: { [Op.in]: cartIds },
      estado: {
        [Op.in]: [
          "aprobado",
          "reembolsado_parcial",
          "reembolsado",
          "procesando",
          "pendiente",
          "rechazado",
        ],
      },
    },
    order: [["id", "ASC"]],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  for (const payment of payments as any[]) {
    const isApproved = [
      "aprobado",
      "reembolsado_parcial",
      "reembolsado",
    ].includes(String(payment.estado));

    if (isApproved) {
      const netApproved = Number(
        await approvedCartAmount(payment.carrito_id, transaction),
      );
      if (netApproved > 0) {
        throw new AppError(
          409,
          "EVENT_RESERVATION_HAS_ACTIVE_PAYMENT",
          actionMessage ??
            "La reserva de evento ya posee pagos asociados y no puede modificarse",
        );
      }
      continue;
    }

    if (payment.estado === "procesando" || payment.estado === "pendiente") {
      const cart = await Carrito.findByPk(payment.carrito_id, {
        transaction,
      });

      if (
        cart &&
        !["expirado", "cancelado"].includes(
          String(cart.estado).toLowerCase(),
        )
      ) {
        throw new AppError(
          409,
          "EVENT_RESERVATION_HAS_ACTIVE_PAYMENT",
          actionMessage ??
            "La reserva de evento ya posee pagos asociados y no puede modificarse",
        );
      }

      if (payment.metodo === "tarjeta" && payment.id_transaccion_externo) {
        try {
          const intent = await stripeService.retrievePaymentIntent(
            payment.id_transaccion_externo,
          );
          if (intent.status === "canceled") {
            await payment.update({ estado: "cancelado" }, { transaction });
            continue;
          }
          if (intent.status === "succeeded") {
            await payment.update(
              {
                estado: "aprobado",
                fecha_pago: new Date(),
                codigo_error_externo: null,
                mensaje_error: null,
              },
              { transaction },
            );
            throw new AppError(
              409,
              "EVENT_RESERVATION_HAS_ACTIVE_PAYMENT",
              actionMessage ??
                "La reserva de evento ya posee pagos asociados y no puede modificarse",
            );
          }
          if (
            cart &&
            ["expirado", "cancelado"].includes(
              String(cart.estado).toLowerCase(),
            ) &&
            intent.status !== "processing"
          ) {
            try {
              const canceled = await stripeService.cancelPaymentIntent(
                payment.id_transaccion_externo,
              );
              if (canceled?.status === "canceled") {
                await payment.update(
                  { estado: "cancelado" },
                  { transaction },
                );
                continue;
              }
            } catch {
              // si no se pudo cancelar en Stripe, se mantiene activo
            }
          }
        } catch (err: any) {
          if (err instanceof AppError) throw err;
        }
      }

      throw new AppError(
        409,
        "EVENT_RESERVATION_HAS_ACTIVE_PAYMENT",
        actionMessage ??
          "La reserva de evento tiene un pago en procesamiento y no puede modificarse",
      );
    }

    if (payment.estado === "rechazado") {
      if (payment.metodo === "tarjeta" && payment.id_transaccion_externo) {
        try {
          const intent = await stripeService.retrievePaymentIntent(
            payment.id_transaccion_externo,
          );
          if (intent.status === "canceled") {
            await payment.update({ estado: "cancelado" }, { transaction });
            continue;
          }
          if (intent.status === "succeeded") {
            await payment.update(
              {
                estado: "aprobado",
                fecha_pago: new Date(),
                codigo_error_externo: null,
                mensaje_error: null,
              },
              { transaction },
            );
            throw new AppError(
              409,
              "EVENT_RESERVATION_HAS_ACTIVE_PAYMENT",
              actionMessage ??
                "La reserva de evento ya posee pagos asociados y no puede modificarse",
            );
          }
          if (
            [
              "requires_payment_method",
              "requires_confirmation",
              "requires_action",
              "processing",
            ].includes(intent.status)
          ) {
            const cart = await Carrito.findByPk(payment.carrito_id, {
              transaction,
            });
            if (
              cart &&
              ["expirado", "cancelado"].includes(
                String(cart.estado).toLowerCase(),
              ) &&
              intent.status !== "processing"
            ) {
              try {
                const canceled = await stripeService.cancelPaymentIntent(
                  payment.id_transaccion_externo,
                );
                if (canceled?.status === "canceled") {
                  await payment.update(
                    { estado: "cancelado" },
                    { transaction },
                  );
                  continue;
                }
              } catch {
                // Si la cancelación falló, retiene capacidad
              }
            }

            throw new AppError(
              409,
              "EVENT_RESERVATION_HAS_ACTIVE_PAYMENT",
              actionMessage ??
                "La reserva de evento tiene un intento de pago confirmable en pasarela y no puede modificarse",
            );
          }
        } catch (err: any) {
          if (err instanceof AppError) throw err;
          const cart = await Carrito.findByPk(payment.carrito_id, {
            transaction,
          });
          if (cart && cart.estado === "activo") {
            throw new AppError(
              409,
              "EVENT_RESERVATION_HAS_ACTIVE_PAYMENT",
              actionMessage ??
                "La reserva de evento tiene un intento de pago pendiente en pasarela",
            );
          }
        }
      }
    }
  }
};

export const isReservationFullyPaid = async (
  reservationId: number,
  reservationTotal: number | string,
  transaction: any,
) => {
  const exposure = await reservationFinancialExposure(
    reservationId,
    transaction,
  );
  return exposure.approved >= round(Number(reservationTotal));
};

const confirmReservationIfFullyPaid = async (
  reservationId: number,
  transaction: any,
) => {
  const reservation = await ReservaHabitacion.findByPk(reservationId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!reservation || ["cancelada", "expirada", "finalizada"].includes(String(reservation.estado).toLowerCase())) {
    return;
  }
  if (
    reservation.estado === "pendiente" &&
    await isReservationFullyPaid(reservation.id, reservation.total, transaction)
  ) {
    await reservation.update({ estado: "confirmada" }, { transaction });
  }
};

const confirmCartRoomReservations = async (carritoId: number, transaction: any) => {
  const items = await CarritoItem.findAll({
    where: { carrito_id: carritoId, tipo_item: "habitacion" },
    attributes: ["referencia_id"],
    transaction,
  });
  for (const item of items) {
    await confirmReservationIfFullyPaid(Number(item.referencia_id), transaction);
  }
};

const cartTotals = async (
  carritoId: number,
  transaction: any,
  allowPaidReservations = false,
  lockWellnessAppointments = false,
) => {
  const items = await CarritoItem.findAll({
    where: { carrito_id: carritoId },
    attributes: ["precio", "cantidad", "tipo_item", "referencia_id"],
    transaction,
  });
  const uniqueWellnessAppointmentIds = new Set<number>();
  for (const item of items as any[]) {
    if (item.tipo_item !== "bienestar") continue;
    const appointmentId = Number(item.referencia_id);
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      throw new AppError(
        409,
        "CART_REFERENCE_NOT_AVAILABLE",
        "La cita de bienestar ya no se encuentra disponible",
      );
    }
    uniqueWellnessAppointmentIds.add(appointmentId);
  }
  const wellnessAppointmentIds = [
    ...uniqueWellnessAppointmentIds,
  ].sort((left, right) => left - right);
  const lockedWellnessAppointments = new Map<number, any>();
  for (const appointmentId of wellnessAppointmentIds) {
    const appointmentOptions: Record<string, unknown> = { transaction };
    if (lockWellnessAppointments) {
      appointmentOptions.lock = transaction.LOCK.UPDATE;
    }
    const appointment = await CitaBienestar.findByPk(
      appointmentId,
      appointmentOptions,
    );
    if (!appointment) {
      throw new AppError(
        409,
        "CART_REFERENCE_NOT_AVAILABLE",
        "La cita de bienestar ya no se encuentra disponible",
      );
    }
    lockedWellnessAppointments.set(appointmentId, appointment);
  }
  let requiredAdvance = 0;
  const total = round((await Promise.all(items.map(async (item: any) => {
      const price = Number(item.precio);
      const quantity = Number(item.cantidad);
      if (!Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity <= 0) {
        throw new AppError(422, "INVALID_CART_TOTAL", "El carrito contiene un precio o cantidad inválidos");
      }
      if (item.tipo_item === "habitacion") {
        const reservation = await ReservaHabitacion.findByPk(item.referencia_id, { transaction });
        // Un pago nuevo no puede apuntar a una reserva cancelada, expirada o finalizada. En los flujos que ya
        // reconocen pagos aprobados (allowPaidReservations) no se rechaza, para no interferir con webhooks.
        if (!allowPaidReservations && (!reservation || !payableRoomStates.has(String(reservation.estado).toLowerCase()))) {
          throw new AppError(
            409,
            "CART_REFERENCE_NOT_AVAILABLE",
            "La reserva seleccionada ya no se encuentra disponible",
          );
        }
        if (!allowPaidReservations && reservation && await isReservationPastPaymentDeadline(reservation.id, transaction)) {
          throw new AppError(409, "RESERVATION_PAYMENT_WINDOW_EXPIRED", "El plazo para pagar esta reserva venció");
        }
        if (!allowPaidReservations && reservation && isStayEnded(reservation.fecha_salida)) {
          throw new AppError(409, "RESERVATION_STAY_ENDED", "La estancia de esta reserva ya terminó y no puede pagarse");
        }
        if (
          !allowPaidReservations &&
          reservation &&
          await isReservationFullyPaid(reservation.id, reservation.total, transaction)
        ) {
          throw new AppError(
            409,
            "CART_REFERENCE_NOT_AVAILABLE",
            "La reserva seleccionada ya no se encuentra disponible",
          );
        }
      }
      if (item.tipo_item === "actividad") {
        const reservation = await ReservaActividad.findByPk(item.referencia_id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (
          !reservation ||
          String(reservation.estado).toLowerCase() === "cancelada"
        ) {
          throw new AppError(
            409,
            "CART_REFERENCE_NOT_AVAILABLE",
            "La reserva de actividad ya no se encuentra disponible",
          );
        }
      }
      if (!allowPaidReservations && (item.tipo_item === "mesa" || item.tipo_item === "amenidad")) {
        // Un pago nuevo no puede cubrir una reserva de mesa o amenidad cancelada, vencida o ya utilizada.
        const model = item.tipo_item === "mesa" ? db.ReservaMesa : db.ReservaAmenidad;
        const reservation = await model.findByPk(item.referencia_id, { transaction });
        const state = String(reservation?.estado ?? "").toLowerCase();
        if (!reservation || ["cancelada", "cancelado", "expirada", "expirado", "usada", "finalizada", "completada"].includes(state)) {
          throw new AppError(409, "CART_REFERENCE_NOT_AVAILABLE", "Una reserva del carrito ya no se encuentra disponible");
        }
      }
      if (item.tipo_item === "bienestar") {
        const appointment = lockedWellnessAppointments.get(
          Number(item.referencia_id),
        );
        if (
          !appointment ||
          String(appointment.estado).toLowerCase() !== "confirmada"
        ) {
          throw new AppError(
            409,
            "CART_REFERENCE_NOT_AVAILABLE",
            "La cita de bienestar ya no se encuentra disponible",
          );
        }
      }
      if (item.tipo_item !== "evento") return price * quantity;
      const event = await ReservaEvento.findByPk(item.referencia_id, { transaction });
      if (!event) throw new AppError(404, "EVENT_RESERVATION_NOT_FOUND", "La reserva de evento del carrito no existe");
      if (!payableEventStates.has(String(event.estado).toLowerCase())) {
        throw new AppError(409, "EVENT_RESERVATION_NOT_AVAILABLE", "La reserva de evento no se encuentra disponible para pagos");
      }
      const eventAdvance = Number(event.anticipo);
      if (!Number.isFinite(eventAdvance) || eventAdvance < 0) {
        throw new AppError(422, "INVALID_EVENT_ADVANCE", "La reserva de evento no tiene un anticipo válido");
      }
      requiredAdvance = round(requiredAdvance + eventAdvance);
      const eventTotal = Number(event.total);
      if (!Number.isFinite(eventTotal) || eventTotal < 0) {
        throw new AppError(422, "INVALID_EVENT_TOTAL", "La reserva de evento no tiene un total válido");
      }
      return eventTotal * quantity;
    }))).reduce((sum, itemTotal) => sum + itemTotal, 0));
  const isOnlyRoom = items.length > 0 && items.every((item: any) => item.tipo_item === "habitacion");
  // Los pagos se registran por carrito, no por artículo: un cobro parcial contaría como cubierto para la habitación.
  const hasRoom = items.some((item: any) => item.tipo_item === "habitacion");
  return {
    total,
    requiredAdvance,
    isOnlyRoom,
    hasRoom,
    wellnessAppointmentIds,
    wellnessAppointments: [...lockedWellnessAppointments.values()],
  };
};

const approvedAdvanceAmount = async (where: Record<string, unknown>, transaction: any) => {
  const payments = await Pago.findAll({
    where: { ...where, estado: { [Op.in]: ["aprobado", "reembolsado_parcial", "reembolsado"] }, tipo_pago: "anticipo" },
    attributes: ["id", "monto"],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  let sum = 0;
  for (const payment of payments) {
    const refunds = await db.Reembolso.findAll({
      where: { pago_id: payment.id, estado: "aprobado" },
      attributes: ["monto"],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const refunded = refunds.reduce((acc: number, r: any) => acc + Number(r.monto), 0);
    sum += Math.max(0, Number(payment.monto) - refunded);
  }
  return round(sum);
};

const roomReservationIdsForCart = async (
  carritoId: number,
  transaction: any,
) => {
  const roomItems = await CarritoItem.findAll({
    where: {
      carrito_id: carritoId,
      tipo_item: "habitacion",
    },
    attributes: ["referencia_id"],
    order: [["referencia_id", "ASC"]],
    transaction,
  });

  return [
    ...new Set<number>(
      (roomItems as any[]).map((item: any) => Number(item.referencia_id)),
    ),
  ].sort((left, right) => left - right);
};

const eventReservationIdsForCart = async (
  carritoId: number,
  transaction: any,
) => {
  const eventItems = await CarritoItem.findAll({
    where: {
      carrito_id: carritoId,
      tipo_item: "evento",
    },
    attributes: ["referencia_id"],
    order: [["referencia_id", "ASC"]],
    transaction,
  });

  return [
    ...new Set<number>(
      (eventItems as any[]).map((item: any) => Number(item.referencia_id)),
    ),
  ].sort((left, right) => left - right);
};

const lockRoomReservations = async (
  reservationIds: number[],
  transaction: any,
) => {
  const reservations = [];
  for (const reservationId of reservationIds) {
    const reservation = await ReservaHabitacion.findByPk(reservationId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!reservation) {
      throw new AppError(
        409,
        "CART_REFERENCE_NOT_AVAILABLE",
        "La reserva seleccionada ya no se encuentra disponible",
      );
    }
    reservations.push(reservation);
  }
  return reservations;
};


const lockEventReservations = async (
  reservationIds: number[],
  transaction: any,
) => {
  const reservations = [];
  for (const reservationId of reservationIds) {
    const reservation = await ReservaEvento.findByPk(reservationId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!reservation) {
      throw new AppError(
        409,
        "CART_REFERENCE_NOT_AVAILABLE",
        "La reserva seleccionada ya no se encuentra disponible",
      );
    }
    reservations.push(reservation);
  }
  return reservations;
};

const validateOpenOrigin = async (
  data: CreatePagoData,
  transaction: any,
  allowPaid = false,
  serializeRoomExposure = false,
) => {
  if (data.carrito_id !== undefined && data.carrito_id !== null) {
    const cart = await Carrito.findByPk(data.carrito_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!cart) throw new AppError(404, "CART_NOT_FOUND", "El carrito solicitado no existe");
    if (cart.estado === "activo" && cart.expira_en && new Date(cart.expira_en).getTime() <= Date.now()) {
      throw new AppError(409, "CART_NOT_AVAILABLE", "El carrito ya no se encuentra disponible para pagos");
    }
    if ((!allowPaid && terminal.has(String(cart.estado).toLowerCase())) ||
        (cart.estado !== "activo" && !(allowPaid && cart.estado === "pagado"))) {
      throw new AppError(409, "CART_NOT_AVAILABLE", "El carrito ya no se encuentra disponible para pagos");
    }
    const roomReservationIds = await roomReservationIdsForCart(
      cart.id,
      transaction,
    );
    const roomReservations = serializeRoomExposure
      ? await lockRoomReservations(roomReservationIds, transaction)
      : [];
    const eventReservationIds = await eventReservationIdsForCart(
      cart.id,
      transaction,
    );
    const eventReservations = serializeRoomExposure
      ? await lockEventReservations(eventReservationIds, transaction)
      : [];
    const totals = await cartTotals(
      cart.id,
      transaction,
      allowPaid,
      serializeRoomExposure,
    );
    return {
      key: { carrito_id: cart.id },
      ...totals,
      origin: cart,
      roomReservationIds,
      roomReservations,
      eventReservationIds,
      eventReservations,
      wellnessAppointmentIds: totals.wellnessAppointmentIds ?? [],
      wellnessAppointments: totals.wellnessAppointments ?? [],
    };
  }

  const reservation = await ReservaHabitacion.findByPk(data.reserva_habitacion_id, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!reservation) throw new AppError(404, "RESERVA_HABITACION_NOT_FOUND", "La reserva de habitación no fue encontrada");
  if (!payableRoomStates.has(String(reservation.estado).toLowerCase())) {
    throw new AppError(409, "RESERVATION_NOT_AVAILABLE", "La reserva ya no se encuentra disponible para pagos");
  }
  if (!allowPaid && await isReservationPastPaymentDeadline(reservation.id, transaction)) {
    throw new AppError(409, "RESERVATION_PAYMENT_WINDOW_EXPIRED", "El plazo para pagar esta reserva venció");
  }
  if (!allowPaid && isStayEnded(reservation.fecha_salida)) {
    throw new AppError(409, "RESERVATION_STAY_ENDED", "La estancia de esta reserva ya terminó y no puede pagarse");
  }
  if (
    !allowPaid &&
    await isReservationFullyPaid(reservation.id, reservation.total, transaction)
  ) {
    throw new AppError(409, "RESERVATION_ALREADY_PAID", "La reserva ya se encuentra completamente pagada");
  }
  return {
    key: { reserva_habitacion_id: reservation.id },
    total: round(Number(reservation.total)),
    requiredAdvance: 0,
    isOnlyRoom: true,
    hasRoom: true,
    origin: reservation,
    roomReservationIds: [Number(reservation.id)],
    roomReservations: [reservation],
    eventReservationIds: [],
    eventReservations: [],
    wellnessAppointmentIds: [],
    wellnessAppointments: [],
  };
};

const roomExposureBalance = async (
  details: any,
  transaction: any,
  newCartAmountCents?: number,
) => {
  if (!details.roomReservationIds?.length) {
    return null;
  }

  const reservationsById = new Map<number, any>(
    (details.roomReservations ?? []).map((reservation: any) => [
      Number(reservation.id),
      reservation,
    ]),
  );
  let remainingCents = 0;
  let directExposure: Awaited<
    ReturnType<typeof reservationFinancialExposure>
  > | null = null;

  for (const reservationId of details.roomReservationIds as number[]) {
    const reservation = reservationsById.get(Number(reservationId));
    if (!reservation) {
      throw new AppError(
        409,
        "CART_REFERENCE_NOT_AVAILABLE",
        "La reserva seleccionada ya no se encuentra disponible",
      );
    }
    const exposure = await reservationFinancialExposure(
      Number(reservationId),
      transaction,
    );
    const obligationCents = toCents(reservation.total);
    const exposureCents = toCents(exposure.total);
    remainingCents += Math.max(
      0,
      obligationCents - exposureCents,
    );
    if (newCartAmountCents !== undefined) {
      const allocationCents = await allocateCartAmountToReferenceCents(
        Number(details.origin.id),
        newCartAmountCents,
        "habitacion",
        Number(reservationId),
        transaction,
      );
      if (exposureCents + allocationCents > obligationCents) {
        throw new AppError(
          409,
          "PAYMENT_EXCEEDS_BALANCE",
          "El pago excede el saldo pendiente",
        );
      }
    }
    if (
      details.origin?.constructor?.name === "ReservaHabitacion" &&
      Number(details.origin.id) === Number(reservationId)
    ) {
      directExposure = exposure;
    }
  }

  const roomReservationsTotal = (details.roomReservations ?? []).reduce(
    (sum: number, res: any) => sum + Number(res.total),
    0,
  );
  const nonRoomCartTotal = Math.max(
    0,
    round(Number(details.total) - roomReservationsTotal),
  );

  return {
    remaining: round(remainingCents / 100),
    remainingCents,
    directExposure,
  };
};

const eventExposureBalance = async (
  details: any,
  transaction: any,
  newCartAmountCents?: number,
) => {
  if (!details.eventReservationIds?.length) {
    return null;
  }

  const reservationsById = new Map<number, any>(
    (details.eventReservations ?? []).map((reservation: any) => [
      Number(reservation.id),
      reservation,
    ]),
  );
  let remainingCents = 0;

  for (const reservationId of details.eventReservationIds as number[]) {
    const reservation = reservationsById.get(Number(reservationId));
    if (!reservation) {
      throw new AppError(
        409,
        "CART_REFERENCE_NOT_AVAILABLE",
        "La reserva seleccionada ya no se encuentra disponible",
      );
    }
    const exposure = await eventFinancialExposure(
      Number(reservationId),
      transaction,
    );
    const obligationCents = toCents(reservation.total);
    const exposureCents = toCents(exposure.total);
    remainingCents += Math.max(
      0,
      obligationCents - exposureCents,
    );
    if (newCartAmountCents !== undefined) {
      const allocationCents = await allocateCartAmountToReferenceCents(
        Number(details.origin.id),
        newCartAmountCents,
        "evento",
        Number(reservationId),
        transaction,
        true,
      );
      if (exposureCents + allocationCents > obligationCents) {
        throw new AppError(
          409,
          "PAYMENT_EXCEEDS_BALANCE",
          "El pago excede el saldo pendiente",
        );
      }
    }
  }

  return { remaining: round(remainingCents / 100), remainingCents };
};

const wellnessExposureBalance = async (
  details: any,
  transaction: any,
  newCartAmountCents?: number,
  excludePaymentId?: number,
) => {
  if (!details.wellnessAppointmentIds?.length) {
    return null;
  }

  const appointmentsById = new Map<number, any>(
    (details.wellnessAppointments ?? []).map((appointment: any) => [
      Number(appointment.id),
      appointment,
    ]),
  );
  let remainingCents = 0;

  for (const citaId of details.wellnessAppointmentIds as number[]) {
    const appointment = appointmentsById.get(Number(citaId));
    if (!appointment) {
      throw new AppError(
        409,
        "CART_REFERENCE_NOT_AVAILABLE",
        "La cita de bienestar ya no se encuentra disponible",
      );
    }
    const service = await ServicioBienestar.findByPk(
      appointment.servicio_bienestar_id,
      { transaction },
    );
    if (!service) {
      throw new AppError(
        404,
        "WELLNESS_SERVICE_NOT_FOUND",
        "El servicio de spa ya no se encuentra disponible",
      );
    }
    const exposure = await wellnessFinancialExposure(
      Number(citaId),
      transaction,
      excludePaymentId,
    );
    const obligationCents = toCents(service.precio);
    const exposureCents = toCents(exposure.total);
    remainingCents += Math.max(
      0,
      obligationCents - exposureCents,
    );
    if (newCartAmountCents !== undefined) {
      const allocationCents = await allocateCartAmountToReferenceCents(
        Number(details.origin.id),
        newCartAmountCents,
        "bienestar",
        Number(citaId),
        transaction,
        true,
      );
      if (exposureCents + allocationCents > obligationCents) {
        throw new AppError(
          409,
          "PAYMENT_EXCEEDS_BALANCE",
          "El pago excede el saldo pendiente",
        );
      }
    }
  }

  return { remaining: round(remainingCents / 100), remainingCents };
};

const applyCartPaid = async (origin: any, total: number, paid: number, transaction: any) => {
  if (origin && origin.constructor?.name === "Carrito") {
    const actualPaid = await approvedAmount({ carrito_id: origin.id }, transaction);
    const totals = await cartTotals(origin.id, transaction, true);
    if (actualPaid >= totals.total) {
      await origin.update({ estado: "pagado" }, { transaction });
      await confirmCartRoomReservations(origin.id, transaction);
    }
  }
};

const findIdempotencyReplay = async (
  data: CreatePagoData,
  amount: number,
  tipo: PagoTipo,
  transaction: any,
) => {
  if (!data.idempotency_key) return null;

  const existing = await Pago.findOne({
    where: { idempotency_key: data.idempotency_key },
    transaction,
  });
  if (!existing) return null;

  if (
    existing.metodo !== data.metodo ||
    Number(existing.monto) !== amount ||
    (existing.carrito_id ?? null) !== (data.carrito_id ?? null) ||
    (existing.reserva_habitacion_id ?? null) !==
      (data.reserva_habitacion_id ?? null) ||
    existing.tipo_pago !== tipo
  ) {
    throw new AppError(
      409,
      "IDEMPOTENCY_CONFLICT",
      "La clave de idempotencia ya fue utilizada para otra operación",
    );
  }

  if (existing.metodo === "tarjeta" && existing.id_transaccion_externo) {
    return { payment: existing, retrieveIntent: true };
  }

  // Reintento de una operación cuya fila local ya existe pero aún no tiene PaymentIntent (p. ej. caída entre fases):
  // se completa con la misma clave de idempotencia de Stripe, que devuelve el intento original si ya se creó.
  if (existing.metodo === "tarjeta" && existing.estado === "procesando" && !existing.id_transaccion_externo) {
    return { payment: existing, deferredIntent: true };
  }
  return existing;
};

const assertNoUnresolvedPayments = async (
  originKey: Record<string, unknown>,
  details: { origin: any; total: number; roomReservationIds?: number[]; eventReservationIds?: number[] },
  transaction: any
) => {
  const origins: Record<string | symbol, unknown>[] = [{ ...originKey }];
  if (details.roomReservationIds && details.roomReservationIds.length > 0) {
    for (const resId of details.roomReservationIds) {
      origins.push({ reserva_habitacion_id: resId });
      const historicalCarts = await historicalCartIdsForReference(
        "habitacion",
        resId,
        transaction,
      );
      if (historicalCarts.length > 0) {
        origins.push({ carrito_id: { [Op.in]: historicalCarts } });
      }
    }
  }
  if (details.eventReservationIds && details.eventReservationIds.length > 0) {
    for (const resId of details.eventReservationIds) {
      const historicalCarts = await historicalCartIdsForReference(
        "evento",
        resId,
        transaction,
      );
      if (historicalCarts.length > 0) {
        origins.push({ carrito_id: { [Op.in]: historicalCarts } });
      }
    }
  }

  const candidates = await Pago.findAll({
    where: { [Op.or]: origins },
    order: [["id", "ASC"]],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  // Un fallo de intento no invalida su client_secret. Se conserva la exposición
  // hasta que la verificación/webhook pruebe un resultado terminal. Sin red bajo locks.
  if (candidates.some((p: any) => isUncertainReservationPayment(p))) {
    throw new AppError(409, "RESERVATION_PAYMENT_IN_PROGRESS",
      "Existe un pago pendiente de verificar. Consulte su estado antes de intentar otro pago");
  }
};

const reconcileIdempotentPaymentIntent = async (
  result: any,
  data: CreatePagoData,
  amount: number,
  tipo: PagoTipo,
) => {
  const payment = result?.payment;
  const intent = result?.intent;
  if (!data.idempotency_key || !payment || !intent) {
    return;
  }

  // The transaction has committed at this point. Re-read the payment so Stripe
  // can never be redirected to a row that was rolled back during COMMIT.
  const durablePayment = await Pago.findByPk(payment.id);
  const expectedCartId = data.carrito_id != null
    ? String(data.carrito_id)
    : null;
  const expectedReservationId = data.reserva_habitacion_id != null
    ? String(data.reserva_habitacion_id)
    : null;
  const metadataCartId = intent.metadata?.carrito_id ?? null;
  const metadataReservationId =
    intent.metadata?.reserva_habitacion_id ?? null;

  const matchesCart = metadataCartId === null || metadataCartId === expectedCartId;
  const matchesReservation = metadataReservationId === null || metadataReservationId === expectedReservationId;
  const matchesTipo = !intent.metadata?.tipo_pago || intent.metadata.tipo_pago === tipo;

  const sameEconomicOperation = Boolean(
    durablePayment &&
    durablePayment.idempotency_key === data.idempotency_key &&
    durablePayment.metodo === "tarjeta" &&
    durablePayment.pasarela === "stripe" &&
    durablePayment.id_transaccion_externo === intent.id &&
    Number(durablePayment.monto) === amount &&
    durablePayment.moneda === PAYMENT_CURRENCY &&
    durablePayment.tipo_pago === tipo &&
    (durablePayment.carrito_id ?? null) === (data.carrito_id ?? null) &&
    (durablePayment.reserva_habitacion_id ?? null) ===
      (data.reserva_habitacion_id ?? null) &&
    intent.amount === toStripeAmount(amount, PAYMENT_CURRENCY) &&
    intent.currency?.toLowerCase() === PAYMENT_CURRENCY.toLowerCase() &&
    matchesCart &&
    matchesReservation &&
    matchesTipo
  );

  if (!sameEconomicOperation) {
    throw new AppError(
      409,
      "STRIPE_PAYMENT_MISMATCH",
      "El PaymentIntent no corresponde al pago esperado",
    );
  }

  if (intent.metadata?.pago_id === String(durablePayment.id)) {
    return;
  }

  try {
    await stripeService.updatePaymentIntentMetadata(intent.id, {
      ...(intent.metadata ?? {}),
      pago_id: String(durablePayment.id),
    });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    const reconciliationError = new AppError(
      502,
      "STRIPE_METADATA_RECONCILIATION_FAILED",
      "El pago fue persistido, pero no fue posible reconciliar sus metadatos en Stripe",
    );
    (reconciliationError as AppError & { cause?: unknown }).cause = error;
    throw reconciliationError;
  }
};

/**
 * Cobro en efectivo de recepción: solo lo invoca registrarEfectivoRecepcion después de
 * comprobar rol, sede y confirmación de recepción del dinero. No es accesible por HTTP.
 */
interface CobroRecepcionOptions {
  cobroRecepcion?: { registradoPor: number };
}

export const createPago = async (data: CreatePagoData, requester: RequesterContext, options: CobroRecepcionOptions = {}) => {
  validateOrigin(data);
  if (!PAYMENT_METHODS.includes(data.metodo)) {
    throw new AppError(422, "INVALID_PAYMENT_METHOD", "El método de pago no es válido");
  }
  const cobroRecepcion = options.cobroRecepcion && data.metodo === "efectivo" && data.reserva_habitacion_id !== undefined
    ? options.cobroRecepcion : undefined;
  if (data.metodo === "efectivo" && !isPaymentAdministrator(requester) && !cobroRecepcion) {
    throw new AppError(
      403,
      "CASH_PAYMENT_FORBIDDEN",
      "Solo el personal autorizado puede registrar pagos en efectivo",
    );
  }
  const tipo = data.tipo_pago ?? "total";
  if (!PAYMENT_TYPES.includes(tipo)) {
    throw new AppError(422, "INVALID_PAYMENT_TYPE", "El tipo de pago no es válido");
  }
  if (data.moneda !== undefined && data.moneda !== PAYMENT_CURRENCY) {
    throw new AppError(
      422,
      "UNSUPPORTED_CURRENCY",
      `La moneda de pago debe ser ${PAYMENT_CURRENCY}`,
    );
  }
  const amount = money(data.monto);

  const result = await sequelize.transaction(async (transaction: any) => {
    // En el cobro de recepción la autorización es por sede (ya verificada), no por titularidad.
    if (!cobroRecepcion) await assertPaymentOriginOwnership(data, requester, transaction);
    const earlyReplay = await findIdempotencyReplay(
      data,
      amount,
      tipo,
      transaction,
    );
    if (earlyReplay) return earlyReplay;

    /*
     * Orden canónico para compromisos de referencias:
     * Carrito (si existe) -> ReservaHabitacion por id ascendente ->
     * ReservaEvento por id ascendente -> CitaBienestar por id ascendente ->
     * Pago.
     * Un pago directo comienza en ReservaHabitacion. Nunca se toma Pago antes
     * de Carrito, preservando el orden corregido por QA-PAY-CONC-018.
     */
    const details = await validateOpenOrigin(
      data,
      transaction,
      false,
      true,
    );
    const serializedReplay = await findIdempotencyReplay(
      data,
      amount,
      tipo,
      transaction,
    );
    if (serializedReplay) return serializedReplay;

    await assertNoUnresolvedPayments(details.key, details, transaction);

    const amountCents = toCents(amount);
    const isCartOrigin = details.key.carrito_id !== undefined;
    const roomBalance = await roomExposureBalance(
      details,
      transaction,
      isCartOrigin ? amountCents : undefined,
    );
    await eventExposureBalance(
      details,
      transaction,
      isCartOrigin ? amountCents : undefined,
    );
    // Efectivo y tarjeta aumentan inmediatamente la exposición activa
    // (aprobado o procesando). Una transferencia nueva permanece pendiente y
    // se revalida únicamente cuando se intenta aprobar.
    if (data.metodo !== "transferencia") {
      await wellnessExposureBalance(
        details,
        transaction,
        isCartOrigin ? amountCents : undefined,
      );
    }
    const exposure = roomBalance?.directExposure ??
      await committedOrProcessingExposure(details.key, transaction);
    const paid = exposure.approved;
    const advancePaid = details.requiredAdvance
      ? await approvedAdvanceAmount(details.key, transaction)
      : 0;
    const originRemainingCents =
      toCents(details.total) - toCents(exposure.total);
    const remainingCents = isCartOrigin
      ? originRemainingCents
      : Math.min(
          originRemainingCents,
          roomBalance?.remainingCents ?? Number.POSITIVE_INFINITY,
        );
    if (amountCents > remainingCents) {
      throw new AppError(409, "PAYMENT_EXCEEDS_BALANCE", "El pago excede el saldo pendiente");
    }
    if ((details.isOnlyRoom || details.hasRoom) && amountCents < originRemainingCents) {
      throw new AppError(422, "ROOM_PAYMENT_MUST_BE_FULL", "Un carrito con habitaciones debe pagarse completo: no se admiten pagos parciales ni anticipos");
    }
    if (tipo === "anticipo") {
      if (!details.requiredAdvance) {
        throw new AppError(422, "ADVANCE_NOT_APPLICABLE", "El anticipo solo aplica a reservas de evento");
      }
      if (amount < round(Math.max(0, details.requiredAdvance - advancePaid))) {
        throw new AppError(422, "ADVANCE_BELOW_REQUIRED", "El anticipo no alcanza el monto requerido");
      }
    }
    if (tipo === "saldo" && details.requiredAdvance && advancePaid < details.requiredAdvance) {
      throw new AppError(422, "ADVANCE_REQUIRED_FIRST", "Debe cubrirse primero el anticipo requerido");
    }
    const approved = data.metodo === "efectivo";
    const payment = await Pago.create({
      ...details.key,
      monto: amount,
      metodo: data.metodo,
      tipo_pago: tipo,
      moneda: PAYMENT_CURRENCY,
      estado: data.metodo === "tarjeta" ? "procesando" : (approved ? "aprobado" : "pendiente"),
      pasarela: data.metodo === "tarjeta" ? "stripe" : null,
      idempotency_key: data.idempotency_key ?? null,
      fecha_pago: approved ? new Date() : null,
      ...(cobroRecepcion ? { registrado_por_usuario_id: cobroRecepcion.registradoPor } : {}),
    }, { transaction });
    if (data.metodo === "tarjeta") {
      // El PaymentIntent se crea FUERA de esta transacción (ver completeCardPayment): no se mantienen bloqueos de
      // PostgreSQL durante la llamada a Stripe y un fallo del COMMIT ya no puede dejar un intento huérfano.
      return { payment, deferredIntent: true };
    }
    if (approved) {
      await applyCartPaid(details.origin, details.total, round(paid + amount), transaction);
      if (details.origin.constructor?.name === "ReservaHabitacion") {
        await confirmReservationIfFullyPaid(details.origin.id, transaction);
      }
    }
    return payment;
  });

  if (result?.deferredIntent) {
    const finished = await completeCardPayment(result.payment, amount, tipo, data.idempotency_key ?? null);
    await reconcileIdempotentPaymentIntent(finished, data, amount, tipo);
    return finished;
  }
  if (result?.retrieveIntent) {
    try {
      result.intent = await stripeService.retrievePaymentIntent(result.payment.id_transaccion_externo);
    } catch {
      throw new AppError(502, "STRIPE_RETRIEVAL_FAILED", "No fue posible recuperar el pago en Stripe");
    }
  }
  await reconcileIdempotentPaymentIntent(result, data, amount, tipo);
  return result;
};

/** Los reintentos sin referencia solo son seguros dentro de la retención de la clave original. */
const IDEMPOTENCY_SAFE_WINDOW_MS = 20 * 60 * 60_000;

/**
 * Segunda fase, FUERA de PostgreSQL. Un error de red, configuración o persistencia
 * nunca prueba la inexistencia del intento: la fila conserva su bloqueo financiero.
 * No hay compensaciones que puedan cancelar el intento que otra petición está usando.
 */
const completeCardPayment = async (payment: any, amount: number, tipo: PagoTipo, idempotencyKey: string | null) => {
  const durable = await Pago.findByPk(payment.id);
  if (!durable || durable.metodo !== "tarjeta" || durable.pasarela !== "stripe" ||
      !["procesando", "rechazado"].includes(durable.estado)) {
    throw new AppError(409, "PAYMENT_NOT_PENDING", "El pago ya no está pendiente");
  }
  if (durable.id_transaccion_externo) {
    const intent = await stripeService.retrievePaymentIntent(durable.id_transaccion_externo);
    return { payment: durable, intent };
  }
  const age = Date.now() - new Date(durable.createdAt).getTime();
  if (!Number.isFinite(age) || age < 0 || age >= IDEMPOTENCY_SAFE_WINDOW_MS) {
    throw new AppError(409, "PAYMENT_REQUIRES_REVIEW",
      "El pago requiere revisión. No se iniciará otro cobro ni se liberará la reserva; contacte con el hotel");
  }
  let intent: Awaited<ReturnType<typeof stripeService.createPaymentIntent>>;
  try {
    intent = await stripeService.createPaymentIntent(amount, PAYMENT_CURRENCY, {
      pago_id: String(durable.id),
      ...(durable.carrito_id ? { carrito_id: String(durable.carrito_id) } : {}),
      ...(durable.reserva_habitacion_id ? { reserva_habitacion_id: String(durable.reserva_habitacion_id) } : {}),
      tipo_pago: tipo,
    }, idempotencyKey ?? `pago-${durable.id}`);
  } catch {
    throw new AppError(502, "STRIPE_PAYMENT_INTENT_FAILED",
      "No se pudo confirmar el estado del pago. La reserva permanece protegida; consulte su estado antes de reintentar");
  }
  if ((env.NODE_ENV !== "production" && intent.livemode) ||
      intent.amount !== toStripeAmount(durable.monto, durable.moneda) ||
      intent.currency.toUpperCase() !== durable.moneda ||
      intent.metadata?.pago_id !== String(durable.id) ||
      (intent.metadata?.carrito_id ?? null) !== (durable.carrito_id ? String(durable.carrito_id) : null) ||
      (intent.metadata?.reserva_habitacion_id ?? null) !== (durable.reserva_habitacion_id ? String(durable.reserva_habitacion_id) : null)) {
    throw new AppError(409, "STRIPE_PAYMENT_MISMATCH", "El PaymentIntent no corresponde al pago esperado");
  }
  try {
    await Pago.update({ id_transaccion_externo: intent.id }, {
      where: { id: durable.id, estado: "procesando", id_transaccion_externo: null },
    });
    const linked = await Pago.findByPk(durable.id);
    if (!linked || linked.id_transaccion_externo !== intent.id) {
      throw new Error("La asociación local no pudo confirmarse");
    }
    return { payment: linked, intent };
  } catch {
    throw new AppError(502, "PAYMENT_LOCAL_PERSISTENCE_FAILED",
      "No se pudo vincular el pago. La reserva permanece protegida y requiere consultar su estado");
  }
};

interface VerifiedPaymentContext {
  requester: RequesterContext;
  paymentId: number;
  cartId: number | null;
  reservationId: number | null;
}

export const processStripeWebhook = async (object: any, eventType: string, verification?: VerifiedPaymentContext) =>
  sequelize.transaction(async (transaction: any) => {
    const isRefundEvent = eventType.includes("refund");
    const intentId = isRefundEvent ? (typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id) : object.id;

    const discovered = await Pago.findOne({ where: { id_transaccion_externo: intentId }, transaction });
    if (!discovered) throw new AppError(404, "PAYMENT_NOT_FOUND", "No existe un pago para este evento de Stripe");
    if (discovered.carrito_id != null) {
      await Carrito.findByPk(discovered.carrito_id, { transaction, lock: transaction.LOCK.UPDATE });
      await lockRoomReservations(await roomReservationIdsForCart(discovered.carrito_id, transaction), transaction);
    } else if (discovered.reserva_habitacion_id != null) {
      await lockRoomReservations([Number(discovered.reserva_habitacion_id)], transaction);
    }
    const payment = await Pago.findByPk(discovered.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (payment && (payment.id_transaccion_externo !== intentId ||
        payment.carrito_id !== discovered.carrito_id || payment.reserva_habitacion_id !== discovered.reserva_habitacion_id)) {
      throw new AppError(409, "STRIPE_PAYMENT_MISMATCH", "El PaymentIntent no corresponde al pago esperado");
    }
    if (!payment) throw new AppError(404, "PAYMENT_NOT_FOUND", "No existe un pago para este evento de Stripe");

    // La verificación explícita vuelve a comprobar identidad/propiedad bajo
    // los mismos locks que el webhook; ninguna respuesta remota sustituye el JWT.
    if (verification) {
      if (Number(payment.id) !== verification.paymentId ||
          (payment.carrito_id ?? null) !== verification.cartId ||
          (payment.reserva_habitacion_id ?? null) !== verification.reservationId) {
        throw new AppError(409, "STRIPE_PAYMENT_MISMATCH", "El PaymentIntent no corresponde al pago esperado");
      }
      await assertPaymentOwnership(payment, verification.requester, transaction);
    }

    if (isRefundEvent) {
      const refundObj = object as Stripe.Refund;
      let reembolso = await db.Reembolso.findOne({ where: { id_reembolso_externo: refundObj.id }, transaction });

      const refundState = refundObj.status === "succeeded" ? "aprobado" :
                          refundObj.status === "failed" ? "rechazado" : "pendiente";

      if (!reembolso) {
        reembolso = await db.Reembolso.create({
          pago_id: payment.id,
          monto: round(refundObj.amount / 100),
          moneda: refundObj.currency.toUpperCase(),
          motivo: refundObj.reason ?? null,
          estado: refundState,
          fecha_reembolso: refundState === "aprobado" ? new Date(refundObj.created * 1000) : null,
          id_reembolso_externo: refundObj.id,
        }, { transaction });
      } else if (
        reembolso.estado !== refundState &&
        !(reembolso.estado === "aprobado" && refundState !== "aprobado")
      ) {
        await reembolso.update({
          estado: refundState,
          fecha_reembolso: refundState === "aprobado" ? new Date(refundObj.created * 1000) : null
        }, { transaction });
      }

      const refunds = await db.Reembolso.findAll({
        where: { pago_id: payment.id, estado: "aprobado" },
        attributes: ["monto"],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const refunded = round(refunds.reduce((acc: number, r: any) => acc + Number(r.monto), 0));

      let newPaymentState = payment.estado;
      if (refunded === 0) {
        if (payment.estado === "reembolsado_parcial" || payment.estado === "reembolsado") {
          newPaymentState = "aprobado";
        }
      } else if (refunded >= round(Number(payment.monto))) {
        newPaymentState = "reembolsado";
      } else {
        newPaymentState = "reembolsado_parcial";
      }

      if (payment.estado !== newPaymentState) {
        await payment.update({ estado: newPaymentState }, { transaction });
      }
      return payment;
    }

    const intent = object as Stripe.PaymentIntent;
    if (payment.pasarela !== "stripe" || toStripeAmount(payment.monto, payment.moneda) !== intent.amount ||
        payment.moneda.toLowerCase() !== intent.currency.toUpperCase().toLowerCase()) {
      throw new AppError(409, "STRIPE_PAYMENT_MISMATCH", "El PaymentIntent no corresponde al pago esperado");
    }
    if (intent.metadata?.pago_id && intent.metadata.pago_id !== String(payment.id)) {
      throw new AppError(409, "STRIPE_PAYMENT_MISMATCH", "El PaymentIntent no corresponde al pago esperado");
    }
    const target = eventType === "payment_intent.succeeded" ? "aprobado" :
      eventType === "payment_intent.payment_failed" ? "procesando" : "cancelado";
    const shouldUpdate =
      payment.estado !== target &&
      !(["aprobado", "reembolsado", "reembolsado_parcial"].includes(payment.estado) && target !== "aprobado") &&
      !(payment.estado === "cancelado" && target === "procesando") &&
      !(target === "aprobado" && ["reembolsado", "reembolsado_parcial"].includes(payment.estado));
    if (shouldUpdate) {
      const update: Record<string, unknown> = { estado: target };
      if (target === "aprobado") {
        update.fecha_pago = new Date();
        update.codigo_error_externo = null;
        update.mensaje_error = null;
      } else if (target === "procesando") {
        update.codigo_error_externo = intent.last_payment_error?.code ?? "payment_failed";
        update.mensaje_error = (intent.last_payment_error?.message ?? "El pago fue rechazado").slice(0, 255);
      }
      await payment.update(update, { transaction });
    }
    if (target === "aprobado") {
      const details = await validateOpenOrigin({
        carrito_id: payment.carrito_id,
        reserva_habitacion_id: payment.reserva_habitacion_id,
        monto: payment.monto,
        metodo: "tarjeta",
      }, transaction, true);
      const paid = await approvedAmount(details.key, transaction);
      await applyCartPaid(details.origin, details.total, paid, transaction);
      if (details.origin.constructor?.name === "ReservaHabitacion") {
        await confirmReservationIfFullyPaid(details.origin.id, transaction);
      }
    }
    return payment;
  });

export const approveTransferencia = async (pagoId: number) =>
  sequelize.transaction(async (transaction: any) => {
    // Read the origin first, then acquire locks in the same order as createPago.
    const unlockedPayment = await Pago.findByPk(pagoId, { transaction });
    if (!unlockedPayment) throw new AppError(404, "PAYMENT_NOT_FOUND", "El pago no existe");
    const originData = {
      carrito_id: unlockedPayment.carrito_id,
      reserva_habitacion_id: unlockedPayment.reserva_habitacion_id,
      monto: unlockedPayment.monto,
      metodo: unlockedPayment.metodo,
    } as CreatePagoData;
    // Conserva el mismo orden canónico que createPago: Carrito (si existe),
    // ReservaHabitacion, ReservaEvento y CitaBienestar por tipo/id ascendente,
    // y luego Pago.
    const origin = await validateOpenOrigin(
      originData,
      transaction,
      true,
      true,
    );
    const payment = await Pago.findByPk(pagoId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!payment) throw new AppError(404, "PAYMENT_NOT_FOUND", "El pago no existe");
    if (payment.metodo !== "transferencia") {
      throw new AppError(422, "INVALID_TRANSFER_APPROVAL", "Solo se pueden aprobar transferencias");
    }
    if (payment.estado === "aprobado") {
      const paid = await approvedAmount(origin.key, transaction);
      await applyCartPaid(origin.origin, origin.total, paid, transaction);
      if (origin.origin.constructor?.name === "ReservaHabitacion") {
        await confirmReservationIfFullyPaid(origin.origin.id, transaction);
      }
      return payment;
    }
    if (payment.estado !== "pendiente") throw new AppError(409, "PAYMENT_NOT_PENDING", "El pago no está pendiente");
    const details = origin;
    const amountCents = toCents(payment.monto);
    const isCartOrigin = details.key.carrito_id !== undefined;
    const roomBalance = await roomExposureBalance(
      details,
      transaction,
      isCartOrigin ? amountCents : undefined,
    );
    await eventExposureBalance(
      details,
      transaction,
      isCartOrigin ? amountCents : undefined,
    );
    // QA-SPA-FIN-CANDIDATE-049: validar exposición histórica agregada de cada
    // CitaBienestar contenida en el carrito antes de aprobar la transferencia.
    // El pago candidato (pagoId) todavía está pendiente, así que
    // wellnessFinancialExposure no lo incluye; la cuota que aportaría se
    // calcula aparte mediante allocateCartAmountToReferenceCents.
    await wellnessExposureBalance(
      details,
      transaction,
      isCartOrigin ? amountCents : undefined,
      pagoId,
    );
    const exposure = roomBalance?.directExposure ??
      await committedOrProcessingExposure(details.key, transaction);
    const paid = exposure.approved;
    const advancePaid = details.requiredAdvance
      ? await approvedAdvanceAmount(details.key, transaction)
      : 0;
    const type = payment.tipo_pago as PagoTipo;
    const originRemainingCents =
      toCents(details.total) - toCents(exposure.total);
    const remainingCents = isCartOrigin
      ? originRemainingCents
      : Math.min(
          originRemainingCents,
          roomBalance?.remainingCents ?? Number.POSITIVE_INFINITY,
        );
    if (amountCents > remainingCents) {
      throw new AppError(409, "PAYMENT_EXCEEDS_BALANCE", "El pago excede el saldo pendiente");
    }
    if ((details.isOnlyRoom || details.hasRoom) && amountCents < originRemainingCents) {
      throw new AppError(422, "ROOM_PAYMENT_MUST_BE_FULL", "Un carrito con habitaciones debe pagarse completo: no se admiten pagos parciales ni anticipos");
    }
    if (type === "anticipo") {
      if (!details.requiredAdvance) {
        throw new AppError(422, "ADVANCE_NOT_APPLICABLE", "El anticipo solo aplica a reservas de evento");
      }
      if (Number(payment.monto) < round(Math.max(0, details.requiredAdvance - advancePaid))) {
        throw new AppError(422, "ADVANCE_BELOW_REQUIRED", "El anticipo no alcanza el monto requerido");
      }
    }
    if (type === "saldo" && details.requiredAdvance && advancePaid < details.requiredAdvance) {
      throw new AppError(422, "ADVANCE_REQUIRED_FIRST", "Debe cubrirse primero el anticipo requerido");
    }
    await payment.update({ estado: "aprobado", fecha_pago: new Date(), pasarela: null }, { transaction });
    await applyCartPaid(details.origin, details.total, round(paid + Number(payment.monto)), transaction);
    if (details.origin.constructor?.name === "ReservaHabitacion") {
      await confirmReservationIfFullyPaid(details.origin.id, transaction);
    }
    return payment;
  });

export const getResumenPago = async (
  origin: { carrito_id?: number; reserva_habitacion_id?: number },
  requester: RequesterContext,
) =>
  sequelize.transaction(async (transaction: any) => {
    validateOrigin({ ...origin, monto: 1, metodo: "efectivo" });
    await assertPaymentOriginOwnership(origin, requester, transaction);
    const details = await validateOpenOrigin(origin as CreatePagoData, transaction, true);
    const paid = details.origin.constructor?.name === "ReservaHabitacion"
      ? (await reservationFinancialExposure(details.origin.id, transaction)).approved
      : await approvedAmount(details.key, transaction);
    return {
      total: details.total,
      anticipo_requerido: details.requiredAdvance,
      aprobado: paid,
      saldo: round(Math.max(0, details.total - paid)),
    };
  });

export const getPagoById = async (id: number, requester: RequesterContext) => {
  const pago = await Pago.findByPk(id);
  if (!pago) throw new AppError(404, "PAYMENT_NOT_FOUND", "El pago no existe");
  await assertPaymentOwnership(pago, requester);
  return pago;
};

/** Consulta Stripe desde el servidor y aplica únicamente resultados terminales
 * verificados. No crea intentos, cargos ni reembolsos; es seguro repetirla. */
export const verifyPago = async (id: number, requester: RequesterContext) => {
  const payment = await getPagoById(id, requester);
  if (payment.metodo !== "tarjeta" || payment.pasarela !== "stripe" || !payment.id_transaccion_externo) {
    throw new AppError(422, "PAYMENT_NOT_VERIFIABLE", "El pago no tiene un intento de tarjeta que se pueda verificar");
  }
  if (["aprobado", "reembolsado", "reembolsado_parcial"].includes(payment.estado)) return payment;

  let intent: Awaited<ReturnType<typeof stripeService.retrievePaymentIntent>>;
  try {
    intent = await stripeService.retrievePaymentIntent(payment.id_transaccion_externo);
  } catch {
    throw new AppError(502, "STRIPE_RETRIEVAL_FAILED", "No fue posible consultar el estado del pago en Stripe");
  }
  if (intent.id !== payment.id_transaccion_externo ||
      intent.amount !== toStripeAmount(payment.monto, payment.moneda) ||
      intent.currency?.toUpperCase() !== payment.moneda ||
      intent.metadata?.pago_id !== String(payment.id) ||
      (intent.metadata?.carrito_id ?? null) !== (payment.carrito_id ? String(payment.carrito_id) : null) ||
      (intent.metadata?.reserva_habitacion_id ?? null) !== (payment.reserva_habitacion_id ? String(payment.reserva_habitacion_id) : null) ||
      (env.NODE_ENV !== "production" && intent.livemode) ||
      (intent.status === "succeeded" && intent.amount_received !== intent.amount)) {
    throw new AppError(409, "STRIPE_PAYMENT_MISMATCH", "El PaymentIntent no corresponde al pago esperado");
  }
  if (intent.status === "succeeded" || intent.status === "canceled") {
    return processStripeWebhook(intent, intent.status === "succeeded" ? "payment_intent.succeeded" : "payment_intent.canceled", {
      requester, paymentId: Number(payment.id), cartId: payment.carrito_id ?? null,
      reservationId: payment.reserva_habitacion_id ?? null,
    });
  }
  return getPagoById(id, requester);
};

export const getPagos = async (
  filters: Record<string, string> = {},
  requester: RequesterContext,
) => {
  const where: Record<string, unknown> = {};
  for (const field of ["estado", "metodo", "tipo_pago"]) {
    if (filters[field]) where[field] = filters[field];
  }
  for (const field of ["carrito_id", "reserva_habitacion_id"]) {
    if (filters[field]) where[field] = Number(filters[field]);
  }
  if (!isPaymentAdministrator(requester)) {
    const [carts, reservations] = await Promise.all([
      Carrito.findAll({ where: { usuario_id: requester.id }, attributes: ["id"] }),
      ReservaHabitacion.findAll({ where: { usuario_id: requester.id }, attributes: ["id"] }),
    ]);
    (where as any)[Op.or] = [
      { carrito_id: { [Op.in]: carts.map((cart: any) => cart.id) } },
      { reserva_habitacion_id: { [Op.in]: reservations.map((reservation: any) => reservation.id) } },
    ];
  }
  return Pago.findAll({ where, order: [["createdAt", "DESC"]] });
};

export const createReembolso = async (
  pagoId: number,
  data: { monto: number | string; motivo?: string; idempotency_key?: string },
  requester: RequesterContext,
) =>
  sequelize.transaction(async (transaction: any) => {
    if (!isPaymentAdministrator(requester)) {
      throw new AppError(403, "INSUFFICIENT_PERMISSIONS", "No tienes permisos para realizar reembolsos");
    }
    const payment = await Pago.findByPk(pagoId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!payment) throw new AppError(404, "PAYMENT_NOT_FOUND", "El pago no existe");
    if (!["aprobado", "reembolsado_parcial"].includes(payment.estado)) {
      throw new AppError(409, "PAYMENT_NOT_REFUNDABLE", "El pago no se encuentra en un estado reembolsable");
    }

    const isStripe = payment.pasarela === "stripe" && payment.id_transaccion_externo;

    if (!isStripe) {
      if (!data.idempotency_key) {
        throw new AppError(400, "MISSING_IDEMPOTENCY_KEY", "La llave de idempotencia es obligatoria para pagos manuales");
      }
      const existingLocal = await db.Reembolso.findOne({
        where: { id_reembolso_externo: data.idempotency_key },
        transaction
      });
      if (existingLocal) return existingLocal;
    }

    const amount = money(data.monto, "El monto del reembolso");

    const refunds = await db.Reembolso.findAll({
      where: { pago_id: payment.id, estado: "aprobado" },
      attributes: ["monto"],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const refunded = round(refunds.reduce((acc: number, r: any) => acc + Number(r.monto), 0));
    const remaining = round(Number(payment.monto) - refunded);
    if (amount > remaining) {
      throw new AppError(409, "REFUND_EXCEEDS_BALANCE", "El monto del reembolso excede el saldo pagado disponible");
    }

    const isTotal = round(refunded + amount) === round(Number(payment.monto));

    let externalRefundId = null;
    let refundState = "aprobado";
    let refundDate = new Date();

    if (isStripe) {
      try {
        const stripeRefund = await stripeService.createRefund(
          payment.id_transaccion_externo,
          amount,
          payment.moneda,
          data.motivo === "duplicate" || data.motivo === "fraudulent" || data.motivo === "requested_by_customer"
            ? data.motivo : undefined,
          data.idempotency_key
        );
        externalRefundId = stripeRefund.id;

        const existingByExternal = await db.Reembolso.findOne({
          where: { id_reembolso_externo: externalRefundId },
          transaction,
        });
        if (existingByExternal) return existingByExternal;

        refundState = stripeRefund.status === "succeeded" ? "aprobado" :
                      stripeRefund.status === "failed" ? "rechazado" : "pendiente";
        if (refundState !== "aprobado") refundDate = null as any;
      } catch (error: any) {
        if (error instanceof AppError) throw error;
        throw new AppError(502, "STRIPE_REFUND_FAILED", "No fue posible procesar el reembolso en Stripe");
      }
    }

    const reembolso = await db.Reembolso.create({
      pago_id: payment.id,
      monto: amount,
      moneda: payment.moneda,
      motivo: data.motivo ?? null,
      estado: refundState,
      fecha_reembolso: refundDate,
      id_reembolso_externo: isStripe ? externalRefundId : data.idempotency_key,
    }, { transaction });

    if (refundState === "aprobado") {
      await payment.update({ estado: isTotal ? "reembolsado" : "reembolsado_parcial" }, { transaction });
    }

    return reembolso;
  });

export const aprobarTransferencia = approveTransferencia;
export const getFinancialSummary = getResumenPago;
export const crearPago = createPago;
export const obtenerResumenFinanciero = getResumenPago;
export const getPaymentSummary = getResumenPago;
export const aprobarPagoTransferencia = approveTransferencia;


export type IntentoActivoEstado =
  | "requiere_confirmacion"
  | "procesando"
  | "completado_en_pasarela"
  | "cancelado";

export interface IntentoActivoData {
  pago_id: number;
  payment_intent_id: string | null;
  client_secret: string | null;
  estado_local: string;
  estado_pasarela: string;
  estado_intento: IntentoActivoEstado;
  monto: number;
  moneda: string;
  puede_confirmar: boolean;
}

export const getIntentoActivo = async (
  origin: { carrito_id?: number; reserva_habitacion_id?: number },
  requester: RequesterContext,
): Promise<IntentoActivoData | null> => {
  validateOrigin({ ...origin, monto: 1, metodo: "efectivo" });

  const originKey = origin.carrito_id
    ? { carrito_id: origin.carrito_id }
    : { reserva_habitacion_id: origin.reserva_habitacion_id };

  await assertPaymentOriginOwnership(origin, requester);

  const payment = await Pago.findOne({
    where: {
      ...originKey,
      metodo: "tarjeta",
      estado: {
        [Op.in]: ["procesando", "rechazado", "pendiente"],
      },
    },
    order: [["id", "DESC"]],
  });

  if (!payment) {
    return null;
  }

  if (!payment.id_transaccion_externo) {
    return {
      pago_id: payment.id,
      payment_intent_id: null,
      client_secret: null,
      estado_local: payment.estado,
      estado_pasarela: "sin_identificador",
      estado_intento: "procesando",
      monto: Number(payment.monto),
      moneda: payment.moneda,
      puede_confirmar: false,
    };
  }

  let intent: Awaited<ReturnType<typeof stripeService.retrievePaymentIntent>>;
  try {
    intent = await stripeService.retrievePaymentIntent(payment.id_transaccion_externo);
  } catch {
    throw new AppError(
      502,
      "STRIPE_RETRIEVAL_FAILED",
      "No fue posible consultar el estado del pago en Stripe",
    );
  }

  let estado_intento: IntentoActivoEstado;
  let puede_confirmar = false;

  switch (intent.status) {
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
      estado_intento = "requiere_confirmacion";
      puede_confirmar = true;
      break;
    case "processing":
      estado_intento = "procesando";
      puede_confirmar = false;
      break;
    case "succeeded":
      estado_intento = "completado_en_pasarela";
      puede_confirmar = false;
      break;
    case "canceled":
      estado_intento = "cancelado";
      puede_confirmar = false;
      break;
    default:
      estado_intento = "procesando";
      puede_confirmar = false;
      break;
  }

  // La respuesta remota puede llegar después de un webhook o del vencimiento.
  // Revalidar estado y origen antes de entregar un secreto reutilizable.
  if (puede_confirmar) {
    puede_confirmar = await sequelize.transaction(async (transaction: any) => {
      await assertPaymentOriginOwnership(origin, requester, transaction);
      try {
        await validateOpenOrigin({ ...origin, monto: payment.monto, metodo: "tarjeta" }, transaction);
      } catch (error) {
        if (error instanceof AppError && error.statusCode === 409) return false;
        throw error;
      }
      const current = await Pago.findByPk(payment.id, { transaction });
      return Boolean(current && ["procesando", "rechazado", "pendiente"].includes(current.estado) && current.id_transaccion_externo === intent.id);
    });
  }
  if (intent.id !== payment.id_transaccion_externo || (env.NODE_ENV !== "production" && intent.livemode) ||
      intent.amount !== toStripeAmount(payment.monto, payment.moneda) ||
      intent.currency.toUpperCase() !== payment.moneda || intent.metadata?.pago_id !== String(payment.id) ||
      (intent.metadata?.carrito_id ?? null) !== (payment.carrito_id ? String(payment.carrito_id) : null) ||
      (intent.metadata?.reserva_habitacion_id ?? null) !== (payment.reserva_habitacion_id ? String(payment.reserva_habitacion_id) : null)) {
    throw new AppError(409, "STRIPE_PAYMENT_MISMATCH", "El PaymentIntent no corresponde al pago esperado");
  }
  return {
    pago_id: payment.id,
    payment_intent_id: intent.id,
    client_secret: puede_confirmar ? intent.client_secret : null,
    estado_local: payment.estado,
    estado_pasarela: intent.status,
    estado_intento,
    monto: Number(payment.monto),
    moneda: payment.moneda,
    puede_confirmar,
  };
};


// ======================================================
// COBRO EN EFECTIVO DESDE RECEPCIÓN
// ======================================================

/** Roles que pueden registrar efectivo recibido en mostrador para reservas de habitación de sus sedes. */
export const ROLES_COBRO_EFECTIVO_RECEPCION: Role[] = [ROLES.ADMIN, ROLES.RECEPCIONISTA, ROLES.GERENTE_HABITACIONES];

const reservaEnAlcance = async (reservaId: number, requester: RequesterContext, scope: SedeScope) => {
  if (!ROLES_COBRO_EFECTIVO_RECEPCION.includes(requester.rol)) {
    throw new AppError(403, "CASH_PAYMENT_FORBIDDEN", "Su rol no puede registrar cobros en efectivo");
  }
  const reserva = await ReservaHabitacion.findByPk(reservaId, {
    attributes: ["id", "estado", "total", "habitacion_id"],
    include: [{ model: db.Habitacion, attributes: ["id", "sucursal_id"] }],
  });
  if (!reserva) throw new AppError(404, "RESERVA_HABITACION_NOT_FOUND", "La reserva de habitación no fue encontrada");
  assertSedeAccess(scope, reserva.Habitacion?.sucursal_id);
  return reserva;
};

/**
 * Saldo de una reserva para recepción (solo lectura): mismo cálculo que usa el cobro,
 * aprobado y en proceso netos de reembolsos.
 */
export const getSaldoReservaRecepcion = async (reservaId: number, requester: RequesterContext, scope: SedeScope) => {
  const reserva = await reservaEnAlcance(reservaId, requester, scope);
  return sequelize.transaction({ isolationLevel: "REPEATABLE READ" }, async (transaction: any) => {
    const exposure = await reservationFinancialExposure(reserva.id, transaction);
    const total = round(Number(reserva.total));
    return {
      reserva_id: reserva.id,
      estado: reserva.estado,
      total,
      aprobado: exposure.approved,
      en_proceso: exposure.processing,
      saldo: round(Math.max(0, total - exposure.total)),
    };
  });
};

/**
 * Registra efectivo recibido físicamente en recepción para una reserva de habitación.
 * - Exige confirmación explícita de que el dinero se recibió.
 * - Solo el saldo completo (las habitaciones no admiten pagos parciales) y sin pagos en proceso.
 * - Reutiliza createPago: bloqueo de la reserva, saldo, idempotencia y confirmación al quedar cubierta.
 * - Deja trazado el empleado que registró el cobro. No usa Stripe ni crea PaymentIntents.
 */
export const registrarEfectivoRecepcion = async (
  data: { reserva_id: number; monto: number; idempotency_key: string; efectivo_recibido: boolean },
  requester: RequesterContext,
  scope: SedeScope,
) => {
  if (data.efectivo_recibido !== true) {
    throw new AppError(422, "CASH_RECEIPT_NOT_CONFIRMED", "Confirme que recibió el efectivo antes de registrar el cobro");
  }
  await reservaEnAlcance(data.reserva_id, requester, scope);
  const pago = await createPago(
    {
      reserva_habitacion_id: data.reserva_id,
      monto: data.monto,
      metodo: "efectivo",
      tipo_pago: "total",
      idempotency_key: data.idempotency_key,
    } as CreatePagoData,
    requester,
    { cobroRecepcion: { registradoPor: requester.id } },
  );
  const reserva = await ReservaHabitacion.findByPk(data.reserva_id, { attributes: ["id", "estado"] });
  return { pago, reserva_estado: reserva?.estado ?? null };
};
