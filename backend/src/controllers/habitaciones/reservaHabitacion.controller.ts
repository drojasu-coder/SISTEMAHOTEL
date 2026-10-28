import {
  NextFunction,
  Request,
  Response,
} from "express";

import * as reservaHabitacionService from "../../services/habitaciones/reservaHabitacion.service";

import {
  ROLES,
} from "../../constants/roles";

import {
  AppError,
} from "../../utils/AppError";
import { getSedeScope, parseSucursalIdQuery } from "../../utils/sedeScope";

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
        usuarioId =
          req.user!.id;
      } else {
        usuarioId =
          req.body.usuario_id;

        if (!usuarioId) {
          throw new AppError(
            400,
            "VALIDATION_ERROR",
            "usuario_id es requerido para usuarios administrativos"
          );
        }
      }

      const reservaData = {
        ...req.body,
        usuario_id:
          usuarioId,
      };

      const reserva =
        await reservaHabitacionService.createReservaHabitacion(
          reservaData,
          await staffScope(req)
        );

      res
        .status(201)
        .json({
          success: true,
          statusCode: 201,
          message:
            "Reserva de habitación creada correctamente",
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