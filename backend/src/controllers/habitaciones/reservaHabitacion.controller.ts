import { NextFunction, Request, Response } from "express";
import * as reservaHabitacionService from "../../services/habitaciones/reservaHabitacion.service";
import { ROLES } from "../../constants/roles";
import { AppError } from "../../utils/AppError";

export const getAllReservaHabitaciones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservas = await reservaHabitacionService.getAllReservaHabitaciones(req.user!);
    res.status(200).json({ success: true, statusCode: 200, message: "Reservas de habitación obtenidas correctamente", data: reservas });
  } catch (error) { next(error); }
};

export const getReservaHabitacionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await reservaHabitacionService.getReservaHabitacionById(Number(req.params.id), req.user!);
    res.status(200).json({ success: true, statusCode: 200, message: "Reserva de habitación obtenida correctamente", data: reserva });
  } catch (error) { next(error); }
};

export const createReservaHabitacion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isCliente = req.user?.rol === ROLES.CLIENTE;

    if (isCliente) {
      req.body.usuario_id = req.user!.id;
    } else if (!req.body.usuario_id) {
      throw new AppError(400, "VALIDATION_ERROR", "usuario_id es requerido para administradores");
    }

    const reserva = await reservaHabitacionService.createReservaHabitacion(req.body);
    res.status(201).json({ success: true, statusCode: 201, message: "Reserva de habitación creada correctamente", data: reserva });
  } catch (error) { next(error); }
};

export const updateReservaHabitacion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await reservaHabitacionService.updateReservaHabitacion(Number(req.params.id), req.body);
    res.status(200).json({ success: true, statusCode: 200, message: "Reserva de habitación actualizada correctamente", data: reserva });
  } catch (error) { next(error); }
};

export const deleteReservaHabitacion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await reservaHabitacionService.deleteReservaHabitacion(Number(req.params.id));
    res.status(200).json({ success: true, statusCode: 200, message: "Reserva de habitación cancelada correctamente (se conserva el historial)", data: reserva });
  } catch (error) { next(error); }
};
