import { AppError } from "../utils/AppError";
import { stripeService, toStripeAmount } from "./stripe.service";
import Stripe from "stripe";
import { Op } from "sequelize";
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
} = db;

export type PagoMetodo = "tarjeta" | "efectivo" | "transferencia";
export type PagoTipo = "total" | "anticipo" | "saldo";

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
    where: { ...where, estado: "aprobado" },
    attributes: ["monto"],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  return round(payments.reduce((sum: number, payment: any) => sum + Number(payment.monto), 0));
};

const approvedCartAmount = (carritoId: number, transaction: any) =>
  approvedAmount({ carrito_id: carritoId }, transaction);

export const isReservationFullyPaid = async (
  reservationId: number,
  reservationTotal: number | string,
  transaction: any,
) => {
  const directPaid = await approvedAmount(
    { reserva_habitacion_id: reservationId },
    transaction,
  );
  const roomItems = await CarritoItem.findAll({
    where: { tipo_item: "habitacion", referencia_id: reservationId },
    attributes: ["carrito_id"],
    transaction,
  });
  const cartIds: number[] = [...new Set(
    (roomItems as any[]).map((item: any) => Number(item.carrito_id)),
  )];
  const hasFullyPaidCart = await Promise.all(
    cartIds.map(async (cartId) => {
      const items = await CarritoItem.findAll({
        where: { carrito_id: cartId },
        attributes: ["tipo_item", "referencia_id", "precio", "cantidad"],
        transaction,
      });
      if (
        items.length !== 1 ||
        (items[0] as any).tipo_item !== "habitacion" ||
        Number((items[0] as any).referencia_id) !== reservationId
      ) {
        return false;
      }
      let cartTotal = 0;
      for (const item of items as any[]) {
        cartTotal += Number(item.precio) * Number(item.cantidad);
      }
      cartTotal = round(cartTotal);
      if (cartTotal !== round(Number(reservationTotal))) return false;
      const approvedRaw: any = await approvedCartAmount(cartId, transaction);
      const approved = Number(approvedRaw);
      return cartTotal > 0 && approved >= cartTotal;
    }),
  );
  return directPaid >= round(Number(reservationTotal)) || hasFullyPaidCart.some(Boolean);
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
    where: { ...where, estado: "aprobado", tipo_pago: "anticipo" },
    attributes: ["monto"],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  return round(payments.reduce((sum: number, payment: any) => sum + Number(payment.monto), 0));
};

const validateOpenOrigin = async (data: CreatePagoData, transaction: any, allowPaid = false) => {
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
    const totals = await cartTotals(cart.id, transaction, allowPaid);
    return { key: { carrito_id: cart.id }, ...totals, origin: cart };
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

export const createPago = async (data: CreatePagoData, requester: RequesterContext) => {
  validateOrigin(data);
  if (!["tarjeta", "efectivo", "transferencia"].includes(data.metodo)) {
    throw new AppError(422, "INVALID_PAYMENT_METHOD", "El método de pago no es válido");
  }
  const tipo = data.tipo_pago ?? "total";
  if (!["total", "anticipo", "saldo"].includes(tipo)) {
    throw new AppError(422, "INVALID_PAYMENT_TYPE", "El tipo de pago no es válido");
  }
  if (data.moneda !== undefined && data.moneda !== "GTQ") {
    throw new AppError(422, "UNSUPPORTED_CURRENCY", "La moneda de pago debe ser GTQ");
  }
  const amount = money(data.monto);

  return sequelize.transaction(async (transaction: any) => {
    await assertPaymentOriginOwnership(data, requester, transaction);
    if (data.idempotency_key) {
      const existing = await Pago.findOne({ where: { idempotency_key: data.idempotency_key }, transaction });
      if (existing) {
        if (existing.metodo !== data.metodo || Number(existing.monto) !== amount ||
            existing.carrito_id !== (data.carrito_id ?? null) ||
            existing.reserva_habitacion_id !== (data.reserva_habitacion_id ?? null)) {
          throw new AppError(409, "IDEMPOTENCY_CONFLICT", "La clave de idempotencia ya fue utilizada para otra operación");
        }
        if (existing.metodo === "tarjeta" && existing.id_transaccion_externo) {
          try {
            const intent = await stripeService.retrievePaymentIntent(existing.id_transaccion_externo);
            return { payment: existing, intent };
          } catch {
            throw new AppError(502, "STRIPE_RETRIEVAL_FAILED", "No fue posible recuperar el pago en Stripe");
          }
        }
        return existing;
      }
    }
    const details = await validateOpenOrigin(data, transaction);
    const paid = await approvedAmount(details.key, transaction);
    const advancePaid = details.requiredAdvance
      ? await approvedAdvanceAmount(details.key, transaction)
      : 0;
    const remaining = round(details.total - paid);
    if (amount > remaining) {
      throw new AppError(409, "PAYMENT_EXCEEDS_BALANCE", "El pago excede el saldo pendiente");
    }
    if (details.isOnlyRoom && amount < remaining) {
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
      moneda: "GTQ",
      estado: data.metodo === "tarjeta" ? "procesando" : (approved ? "aprobado" : "pendiente"),
      pasarela: data.metodo === "tarjeta" ? "stripe" : null,
      idempotency_key: data.idempotency_key ?? null,
      fecha_pago: approved ? new Date() : null,
    }, { transaction });
    if (data.metodo === "tarjeta") {
      try {
        const intent = await stripeService.createPaymentIntent(amount, "GTQ", {
          pago_id: String(payment.id),
          ...(payment.carrito_id ? { carrito_id: String(payment.carrito_id) } : {}),
          ...(payment.reserva_habitacion_id ? { reserva_habitacion_id: String(payment.reserva_habitacion_id) } : {}),
          tipo_pago: tipo,
        }, data.idempotency_key);
        await payment.update({ id_transaccion_externo: intent.id }, { transaction });
        return { payment, intent };
      } catch (error: any) {
        if (error instanceof AppError) throw error;
        throw new AppError(502, "STRIPE_PAYMENT_INTENT_FAILED", "No fue posible crear el pago en Stripe");
      }
    }
    if (approved) {
      await applyCartPaid(details.origin, details.total, round(paid + amount), transaction);
      if (details.origin.constructor?.name === "ReservaHabitacion") {
        await confirmReservationIfFullyPaid(details.origin.id, transaction);
      }
    }
    return payment;
  });
};

export const processStripeWebhook = async (intent: Stripe.PaymentIntent, eventType: string) =>
  sequelize.transaction(async (transaction: any) => {
    const payment = await Pago.findOne({ where: { id_transaccion_externo: intent.id }, transaction, lock: transaction.LOCK.UPDATE });
    if (!payment) throw new AppError(404, "PAYMENT_NOT_FOUND", "No existe un pago para este PaymentIntent");
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
      !(payment.estado === "aprobado" && target !== "aprobado");
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
    const origin = await validateOpenOrigin(originData, transaction, true);
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
    const paid = await approvedAmount(details.key, transaction);
    const advancePaid = details.requiredAdvance
      ? await approvedAdvanceAmount(details.key, transaction)
      : 0;
    const type = payment.tipo_pago as PagoTipo;
    if (Number(payment.monto) > round(details.total - paid)) {
      throw new AppError(409, "PAYMENT_EXCEEDS_BALANCE", "El pago excede el saldo pendiente");
    }
    if (details.isOnlyRoom && Number(payment.monto) < round(details.total - paid)) {
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
    const paid = await approvedAmount(details.key, transaction);
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

export const aprobarTransferencia = approveTransferencia;
export const getFinancialSummary = getResumenPago;
export const crearPago = createPago;
export const obtenerResumenFinanciero = getResumenPago;
export const getPaymentSummary = getResumenPago;
export const aprobarPagoTransferencia = approveTransferencia;
