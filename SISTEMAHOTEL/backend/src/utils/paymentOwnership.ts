import { AppError } from "./AppError";
import { ROLES, Role } from "../constants/roles";

const db = require("../models");
const { Carrito, ReservaHabitacion } = db;

export interface RequesterContext {
  id: number;
  rol: Role;
}

export const PAYMENT_ADMINISTRATIVE_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.RECEPCIONISTA,
  ROLES.GERENTE_HABITACIONES,
];

export const isPaymentAdministrator = (requester: RequesterContext) =>
  PAYMENT_ADMINISTRATIVE_ROLES.includes(requester.rol);

const denyPaymentAccess = () =>
  new AppError(403, "PAYMENT_ACCESS_DENIED", "No tiene permisos para acceder a este recurso de pago");

export const assertCartOwnership = (cart: any, requester: RequesterContext) => {
  if (!isPaymentAdministrator(requester) && cart && cart.usuario_id !== requester.id) {
    throw denyPaymentAccess();
  }
};

export const assertRoomReservationOwnership = (
  reservation: any,
  requester: RequesterContext,
) => {
  if (!isPaymentAdministrator(requester) && reservation && reservation.usuario_id !== requester.id) {
    throw denyPaymentAccess();
  }
};

export const assertPaymentOwnership = async (
  payment: any,
  requester: RequesterContext,
  transaction?: any,
) => {
  if (isPaymentAdministrator(requester)) return;

  if (payment.carrito_id !== null && payment.carrito_id !== undefined) {
    const cart = await Carrito.findByPk(payment.carrito_id, { transaction });
    if (cart && cart.usuario_id === requester.id) return;
  } else if (payment.reserva_habitacion_id !== null && payment.reserva_habitacion_id !== undefined) {
    const reservation = await ReservaHabitacion.findByPk(payment.reserva_habitacion_id, { transaction });
    if (reservation && reservation.usuario_id === requester.id) return;
  }

  throw new AppError(404, "PAYMENT_NOT_FOUND", "El pago no existe");
};

export const assertPaymentOriginOwnership = async (
  origin: { carrito_id?: number; reserva_habitacion_id?: number },
  requester: RequesterContext,
  transaction?: any,
) => {
  if (isPaymentAdministrator(requester)) return;

  if (origin.carrito_id !== undefined && origin.carrito_id !== null) {
    const cart = await Carrito.findByPk(origin.carrito_id, { transaction });
    if (cart) assertCartOwnership(cart, requester);
    return;
  }

  if (origin.reserva_habitacion_id !== undefined && origin.reserva_habitacion_id !== null) {
    const reservation = await ReservaHabitacion.findByPk(origin.reserva_habitacion_id, { transaction });
    if (reservation) assertRoomReservationOwnership(reservation, requester);
  }
};
