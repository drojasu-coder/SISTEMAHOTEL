import {
  NextFunction,
  Request,
  Response,
} from "express";

import * as reservaHabitacionService from "../../services/habitaciones/reservaHabitacion.service";
import { removeCancelledRoomReservationFromActiveCarts } from "../../services/carrito/carritoItem.service";

import {
  ROLES,
} from "../../constants/roles";

import {
  AppError,
} from "../../utils/AppError";
import { getSedeScope, parseSucursalIdQuery } from "../../utils/sedeScope";
import { getSaldoReservaRecepcion, registrarEfectivoRecepcion } from "../../services/pago.service";

/**
 * Alcance por sede del personal; el cliente se rige por la propiedad de sus
 * reservas y no recibe alcance de sede.
 */
const staffScope = async (req: Request) =>
  req.user!.rol === ROLES.CLIENTE ? undefined : getSedeScope(req.user!);

export const getAllReservaHabitaciones =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const reservas =
        await reservaHabitacionService.getAllReservaHabitaciones(
          req.user!,
          await staffScope(req),
          parseSucursalIdQuery(req.query.sucursal_id)
        );

      res
        .status(200)
        .json({
          success: true,
          statusCode: 200,
          message:
            "Reservas de habitación obtenidas correctamente",
          data: reservas,
        });
    } catch (error) {
      next(error);
    }
  };

/** GET /api/reservas-habitacion/huespedes?q= — recepción busca cuentas de cliente activas. */
export const searchHuespedes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const huespedes = await reservaHabitacionService.searchHuespedes(String(req.query.q ?? ""), await getSedeScope(req.user!));
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ success: true, statusCode: 200, message: "Huéspedes obtenidos correctamente", data: huespedes });
  } catch (error) {
    next(error);
  }
};

export const getReservaHabitacionById =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const reserva =
        await reservaHabitacionService.getReservaHabitacionById(
          Number(
            req.params.id
          ),
          req.user!,
          await staffScope(req)
        );
      res
        .status(200)
        .json({
          success: true,
          statusCode: 200,
          message:
            "Reserva de habitación obtenida correctamente",
          data: reserva,
        });
    } catch (error) {
      next(error);
    }
  };

export const createReservaHabitacion =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const isCliente =
        req.user?.rol ===
        ROLES.CLIENTE;

      let usuarioId:
        | number
        | undefined;

      /**
       * El cliente nunca puede decidir a qué
       * usuario pertenece la reserva.
       *
       * Siempre utilizamos el ID del JWT.
       */
      if (isCliente) {
        // Solo recepción registra huéspedes sin cuenta.
        if (req.body.huesped !== undefined) {
          throw new AppError(403, "INSUFFICIENT_PERMISSIONS", "Solo el personal puede registrar huéspedes sin cuenta");
        }
        usuarioId =
          req.user!.id;
      } else {
        usuarioId =
          req.body.usuario_id;

        // Personal: cuenta de cliente (usuario_id) o huésped sin cuenta (huesped), nunca ambos.
        if (Boolean(usuarioId) === Boolean(req.body.huesped)) {
          throw new AppError(
            400,
            "VALIDATION_ERROR",
            "Indique usuario_id de un cliente o los datos del huésped sin cuenta, no ambos"
          );
        }
      }

      const reservaData = {
        ...req.body,
        usuario_id:
          usuarioId ?? null,
        // Auditoría: empleado que registra la reserva presencial.
        ...(isCliente ? {} : { registrado_por_usuario_id: req.user!.id }),
      };

      // Solo el cliente puede pedir la vinculación automática al carrito; el campo nunca llega al servicio.
      const agregarAlCarrito = isCliente && req.body.agregar_al_carrito === true;
      delete (reservaData as { agregar_al_carrito?: boolean }).agregar_al_carrito;
      const result: any =
        await reservaHabitacionService.createReservaHabitacion(
          reservaData,
          await staffScope(req),
          { agregarAlCarrito }
        );
      const reserva = agregarAlCarrito
        ? { ...result.reserva.toJSON(), reutilizada: result.reutilizada, carrito: result.carrito }
        : result;
      if (agregarAlCarrito) res.setHeader("Cache-Control", "private, no-store");

      const reutilizada = agregarAlCarrito && result.reutilizada === true;
      res
        .status(reutilizada ? 200 : 201)
        .json({
          success: true,
          statusCode: reutilizada ? 200 : 201,
          message: reutilizada
            ? "La reserva pendiente ya existía y está lista para pagar"
            : "Reserva de habitación creada correctamente",
          data: reserva,
        });
    } catch (error) {
      next(error);
    }
  };

export const updateReservaHabitacion =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const reserva =
        await reservaHabitacionService.updateReservaHabitacion(
          Number(
            req.params.id
          ),
          req.body,
          await staffScope(req)
        );

      res
        .status(200)
        .json({
          success: true,
          statusCode: 200,
          message:
            "Reserva de habitación actualizada correctamente",
          data: reserva,
        });
    } catch (error) {
      next(error);
    }
  };

export const deleteReservaHabitacion =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const reserva =
        await reservaHabitacionService.deleteReservaHabitacion(
          Number(
            req.params.id
          ),
          await staffScope(req)
        );

      res
        .status(200)
        .json({
          success: true,
          statusCode: 200,
          message:
            "Reserva de habitación cancelada correctamente (se conserva el historial)",
          data: reserva,
        });
    } catch (error) {
      next(error);
    }
  };
/** PATCH /api/reservas-habitacion/:id/cancelar — el cliente cancela su propia reserva pendiente. */
export const cancelOwnReservaHabitacion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reserva, ya_cancelada } = await reservaHabitacionService.cancelOwnReservaHabitacion(Number(req.params.id), req.user!.id);
    // Limpieza recuperable y posterior: si falla, la cancelación ya está confirmada y el artículo sigue sin poder pagarse.
    let carritoActualizado = false;
    try {
      carritoActualizado = await removeCancelledRoomReservationFromActiveCarts(Number(req.params.id), req.user!.id);
    } catch {
      carritoActualizado = false;
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: ya_cancelada ? "La reserva ya estaba cancelada" : "Reserva cancelada correctamente",
      data: reserva,
      carrito_actualizado: carritoActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/reservas-habitacion/:id/continuar-pago — vincula la reserva pendiente propia con un carrito válido (sin pagar). */
export const resumeOwnReservaHabitacion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reserva, carrito } = await reservaHabitacionService.resumeOwnReservaHabitacion(Number(req.params.id), req.user!.id);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "La reserva está lista para continuar con el pago",
      data: { ...reserva.toJSON(), reutilizada: true, carrito },
    });
  } catch (error) {
    next(error);
  }
};


/** GET /api/reservas-habitacion/:id/estado-pago — consulta propia sin iniciar cobros. */
export const getOwnReservationPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reservaHabitacionService.getOwnReservationPaymentStatus(Number(req.params.id), req.user!.id);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ success: true, statusCode: 200, message: "Estado de pago consultado", data });
  } catch (error) { next(error); }
};


/** GET /api/reservas-habitacion/:id/saldo — recepción consulta total, pagado y saldo (solo lectura). */
export const getSaldoRecepcion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getSaldoReservaRecepcion(Number(req.params.id), req.user!, await getSedeScope(req.user!));
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ success: true, statusCode: 200, message: "Saldo de la reserva obtenido correctamente", data });
  } catch (error) {
    next(error);
  }
};

/** POST /api/reservas-habitacion/:id/pago-efectivo — recepción registra efectivo recibido en mostrador. */
export const registrarPagoEfectivo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await registrarEfectivoRecepcion(
      { reserva_id: Number(req.params.id), ...req.body },
      req.user!,
      await getSedeScope(req.user!),
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.status(201).json({ success: true, statusCode: 201, message: "Pago en efectivo registrado correctamente", data: result });
  } catch (error) {
    next(error);
  }
};
