import { AppError } from "../utils/AppError";
import { stripeService, toStripeAmount } from "./stripe.service";
import Stripe from "stripe";
import { Op } from "sequelize";
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

const db = require("../models");
const {
  sequelize,
  Pago,
  Carrito,
  CarritoItem,
  ReservaHabitacion,
  ReservaEvento,
  ReservaActividad,
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
      estado: {
        [Op.in]: [
          "aprobado",
          "reembolsado_parcial",
          "reembolsado",
          "procesando",
        ],
      },
    },
    attributes: [
      "id",
      "monto",
      "estado",
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

  const toCents = (value: unknown) =>
    Math.round(Number(value) * 100);
  const allocateCartCents = async (
    carritoId: number,
    amountCents: number,
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
          item.tipo_item === "habitacion" &&
          Number(item.referencia_id) === Number(reservationId),
        weight: Math.max(
          0,
          toCents(Number(item.precio) * Number(item.cantidad)),
        ),
      }))
      .filter((item: any) => item.weight > 0);
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
    shares.sort((left: any, right: any) => {
      if (left.remainder === right.remainder) return left.id - right.id;
      return left.remainder > right.remainder ? -1 : 1;
    });
    for (let index = 0; index < shares.length && undistributed > 0; index += 1) {
      shares[index].cents += 1;
      undistributed -= 1;
    }

    return shares
      .filter((share: any) => share.isTarget)
      .reduce((sum: number, share: any) => sum + share.cents, 0);
  };

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
    const paymentCents = isApproved
      ? Math.max(
          0,
          toCents(payment.monto) -
            toCents(refundedByPayment.get(Number(payment.id)) ?? 0),
        )
      : payment.estado === "procesando"
        ? toCents(payment.monto)
        : 0;

    // Ante datos heredados con ambas llaves, el origen directo tiene
    // precedencia para que un mismo Pago nunca se atribuya dos veces.
    if (directReservationId !== null) {
      if (directReservationId === Number(reservationId)) {
        if (isApproved) approvedCents += paymentCents;
        if (payment.estado === "procesando") processingCents += paymentCents;
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

const cartTotals = async (carritoId: number, transaction: any, allowPaidReservations = false) => {
  const items = await CarritoItem.findAll({
    where: { carrito_id: carritoId },
    attributes: ["precio", "cantidad", "tipo_item", "referencia_id"],
    transaction,
  });
  let requiredAdvance = 0;
  const total = round((await Promise.all(items.map(async (item: any) => {
      const price = Number(item.precio);
      const quantity = Number(item.cantidad);
      if (!Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity <= 0) {
        throw new AppError(422, "INVALID_CART_TOTAL", "El carrito contiene un precio o cantidad inválidos");
      }
      if (item.tipo_item === "habitacion") {
        const reservation = await ReservaHabitacion.findByPk(item.referencia_id, { transaction });
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
  return { total, requiredAdvance, isOnlyRoom };
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
      await cart.update({ estado: "expirado" }, { transaction });
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
    const totals = await cartTotals(cart.id, transaction, allowPaid);
    return {
      key: { carrito_id: cart.id },
      ...totals,
      origin: cart,
      roomReservationIds,
      roomReservations,
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
    origin: reservation,
    roomReservationIds: [Number(reservation.id)],
    roomReservations: [reservation],
  };
};

const roomExposureBalance = async (
  details: any,
  transaction: any,
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
  let remaining = 0;
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
    remaining = round(
      remaining + Math.max(0, Number(reservation.total) - exposure.total),
    );
    if (
      details.origin?.constructor?.name === "ReservaHabitacion" &&
      Number(details.origin.id) === Number(reservationId)
    ) {
      directExposure = exposure;
    }
  }

  return {
    remaining: round(remaining),
    directExposure,
  };
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
    try {
      const intent = await stripeService.retrievePaymentIntent(
        existing.id_transaccion_externo,
      );
      return { payment: existing, intent };
    } catch {
      throw new AppError(
        502,
        "STRIPE_RETRIEVAL_FAILED",
        "No fue posible recuperar el pago en Stripe",
      );
    }
  }

  return existing;
};

const reconcileCanceledStripePayments = async (
  originKey: Record<string, unknown>,
  details: { origin: any; total: number },
  transaction: any
) => {
  const candidates = await Pago.findAll({
    where: {
      ...originKey,
      metodo: "tarjeta",
      estado: { [Op.in]: ["procesando", "rechazado"] },
      id_transaccion_externo: { [Op.ne]: null },
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  for (const p of candidates) {
    try {
      const intent = await stripeService.retrievePaymentIntent(p.id_transaccion_externo);
      if (intent.status === "canceled") {
        await p.update({ estado: "cancelado" }, { transaction });
      } else if (intent.status === "succeeded" && p.estado !== "aprobado") {
        await p.update(
          {
            estado: "aprobado",
            fecha_pago: new Date(),
            codigo_error_externo: null,
            mensaje_error: null,
          },
          { transaction }
        );
        const paid = await approvedAmount(originKey, transaction);
        await applyCartPaid(details.origin, details.total, paid, transaction);
        if (details.origin?.constructor?.name === "ReservaHabitacion") {
          await confirmReservationIfFullyPaid(details.origin.id, transaction);
        }
      } else if (
        p.estado === "rechazado" &&
        ["requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(
          intent.status
        )
      ) {
        // Intento recuperable: en pasarela sigue activo; reservar capacidad para evitar cobro concurrente incompatible
        await p.update({ estado: "procesando" }, { transaction });
      }
    } catch {
      // Ignorar fallos de red hacia Stripe durante la reconciliación silenciosa
    }
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
  if (
    !data.idempotency_key ||
    !payment ||
    !intent ||
    !intent.metadata?.pago_id ||
    intent.metadata.pago_id === String(payment.id)
  ) {
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
    metadataCartId === expectedCartId &&
    metadataReservationId === expectedReservationId &&
    intent.metadata?.tipo_pago === tipo
  );

  if (!sameEconomicOperation) {
    throw new AppError(
      409,
      "STRIPE_PAYMENT_MISMATCH",
      "El PaymentIntent no corresponde al pago esperado",
    );
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

export const createPago = async (data: CreatePagoData, requester: RequesterContext) => {
  validateOrigin(data);
  if (!PAYMENT_METHODS.includes(data.metodo)) {
    throw new AppError(422, "INVALID_PAYMENT_METHOD", "El método de pago no es válido");
  }
  if (data.metodo === "efectivo" && !isPaymentAdministrator(requester)) {
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
    await assertPaymentOriginOwnership(data, requester, transaction);
    const earlyReplay = await findIdempotencyReplay(
      data,
      amount,
      tipo,
      transaction,
    );
    if (earlyReplay) return earlyReplay;

    /*
     * Orden canónico para compromisos de habitación:
     * Carrito (si existe) -> ReservaHabitacion por id ascendente -> Pago.
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

    await reconcileCanceledStripePayments(details.key, details, transaction);

    const roomBalance = await roomExposureBalance(details, transaction);
    const exposure = roomBalance?.directExposure ??
      await committedOrProcessingExposure(details.key, transaction);
    const paid = exposure.approved;
    const advancePaid = details.requiredAdvance
      ? await approvedAdvanceAmount(details.key, transaction)
      : 0;
    const originRemaining = round(details.total - exposure.total);
    const remaining = roomBalance
      ? round(Math.min(originRemaining, roomBalance.remaining))
      : originRemaining;
    if (amount > remaining) {
      throw new AppError(409, "PAYMENT_EXCEEDS_BALANCE", "El pago excede el saldo pendiente");
    }
    if (details.isOnlyRoom && amount < originRemaining) {
      throw new AppError(422, "ROOM_PAYMENT_MUST_BE_FULL", "La reserva de habitación requiere el pago total");
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
    }, { transaction });
    if (data.metodo === "tarjeta") {
      let intent: Awaited<ReturnType<typeof stripeService.createPaymentIntent>>;

      try {
        intent = await stripeService.createPaymentIntent(amount, PAYMENT_CURRENCY, {
          pago_id: String(payment.id),
          ...(payment.carrito_id ? { carrito_id: String(payment.carrito_id) } : {}),
          ...(payment.reserva_habitacion_id ? { reserva_habitacion_id: String(payment.reserva_habitacion_id) } : {}),
          tipo_pago: tipo,
        }, data.idempotency_key);
      } catch (error: any) {
        if (error instanceof AppError) throw error;
        throw new AppError(502, "STRIPE_PAYMENT_INTENT_FAILED", "No fue posible crear el pago en Stripe");
      }

      try {
        await payment.update({ id_transaccion_externo: intent.id }, { transaction });
      } catch (localError: any) {
        try {
          const canceledIntent = await stripeService.cancelPaymentIntent(intent.id);
          if (canceledIntent.status !== "canceled") {
            throw new Error("Stripe no confirmó la cancelación del PaymentIntent");
          }
        } catch (compensationError: any) {
          const error = new AppError(
            502,
            "PAYMENT_COMPENSATION_FAILED",
            "El PaymentIntent fue creado, pero no fue posible persistir ni compensar la operación",
          );
          (error as AppError & { cause?: unknown }).cause = {
            localError,
            compensationError,
          };
          throw error;
        }

        const error = new AppError(
          500,
          "PAYMENT_LOCAL_PERSISTENCE_FAILED",
          "El PaymentIntent fue creado y compensado, pero no pudo persistirse su asociación local",
        );
        (error as AppError & { cause?: unknown }).cause = localError;
        throw error;
      }

      return { payment, intent };
    }
    if (approved) {
      await applyCartPaid(details.origin, details.total, round(paid + amount), transaction);
      if (details.origin.constructor?.name === "ReservaHabitacion") {
        await confirmReservationIfFullyPaid(details.origin.id, transaction);
      }
    }
    return payment;
  });

  await reconcileIdempotentPaymentIntent(result, data, amount, tipo);
  return result;
};

export const processStripeWebhook = async (object: any, eventType: string) =>
  sequelize.transaction(async (transaction: any) => {
    const isRefundEvent = eventType.includes("refund");
    const intentId = isRefundEvent ? (typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id) : object.id;

    let payment: any;
    if (!isRefundEvent && eventType === "payment_intent.succeeded") {
      const unlockedPayment = await Pago.findOne({
        where: { id_transaccion_externo: intentId },
        transaction,
      });
      if (!unlockedPayment) throw new AppError(404, "PAYMENT_NOT_FOUND", "No existe un pago para este evento de Stripe");

      if (unlockedPayment.carrito_id !== null && unlockedPayment.carrito_id !== undefined) {
        const discoveredPayment = {
          id: Number(unlockedPayment.id),
          externalId: unlockedPayment.id_transaccion_externo,
          carritoId: Number(unlockedPayment.carrito_id),
          reservaHabitacionId: unlockedPayment.reserva_habitacion_id ?? null,
        };

        const cart = await Carrito.findByPk(discoveredPayment.carritoId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!cart) throw new AppError(404, "CART_NOT_FOUND", "El carrito solicitado no existe");

        payment = await Pago.findOne({
          where: { id_transaccion_externo: intentId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (
          !payment ||
          Number(payment.id) !== discoveredPayment.id ||
          payment.id_transaccion_externo !== discoveredPayment.externalId ||
          Number(payment.carrito_id) !== discoveredPayment.carritoId ||
          (payment.reserva_habitacion_id ?? null) !== discoveredPayment.reservaHabitacionId
        ) {
          throw new AppError(409, "STRIPE_PAYMENT_MISMATCH", "El PaymentIntent no corresponde al pago esperado");
        }
      } else {
        payment = await Pago.findOne({
          where: { id_transaccion_externo: intentId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
      }
    } else {
      payment = await Pago.findOne({
        where: { id_transaccion_externo: intentId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
    }
    if (!payment) throw new AppError(404, "PAYMENT_NOT_FOUND", "No existe un pago para este evento de Stripe");

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
      eventType === "payment_intent.payment_failed" ? "rechazado" : "cancelado";
    const shouldUpdate =
      payment.estado !== target &&
      !(payment.estado === "aprobado" && target !== "aprobado") &&
      !(target === "aprobado" && ["reembolsado", "reembolsado_parcial"].includes(payment.estado));
    if (shouldUpdate) {
      const update: Record<string, unknown> = { estado: target };
      if (target === "aprobado") {
        update.fecha_pago = new Date();
        update.codigo_error_externo = null;
        update.mensaje_error = null;
      } else if (target === "rechazado") {
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
    // ReservaHabitacion por id ascendente y finalmente Pago.
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
    const roomBalance = await roomExposureBalance(details, transaction);
    const exposure = roomBalance?.directExposure ??
      await committedOrProcessingExposure(details.key, transaction);
    const paid = exposure.approved;
    const advancePaid = details.requiredAdvance
      ? await approvedAdvanceAmount(details.key, transaction)
      : 0;
    const type = payment.tipo_pago as PagoTipo;
    const originRemaining = round(details.total - exposure.total);
    const remaining = roomBalance
      ? round(Math.min(originRemaining, roomBalance.remaining))
      : originRemaining;
    if (Number(payment.monto) > remaining) {
      throw new AppError(409, "PAYMENT_EXCEEDS_BALANCE", "El pago excede el saldo pendiente");
    }
    if (details.isOnlyRoom && Number(payment.monto) < originRemaining) {
      throw new AppError(422, "ROOM_PAYMENT_MUST_BE_FULL", "La reserva de habitación requiere el pago total");
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

  return sequelize.transaction(async (transaction: any) => {
    await assertPaymentOriginOwnership(origin, requester, transaction);

    const payment = await Pago.findOne({
      where: {
        ...originKey,
        metodo: "tarjeta",
        estado: {
          [Op.in]: ["procesando", "rechazado", "pendiente"],
        },
      },
      order: [["id", "DESC"]],
      transaction,
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
  });
};
