import {
  NextFunction,
  Request,
  Response,
} from "express";

import * as habitacionService from "../../services/habitaciones/habitacion.service";

export const getAllHabitaciones = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habitaciones =
      await habitacionService.getAllHabitaciones();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Habitaciones obtenidas correctamente",
      data: habitaciones,
    });
  } catch (error) {
    next(error);
  }
};

export const getHabitacionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habitacion =
      await habitacionService.getHabitacionById(
        Number(req.params.id)
      );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Habitación obtenida correctamente",
      data: habitacion,
    });
  } catch (error) {
    next(error);
  }
};

export const createHabitacion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habitacion =
      await habitacionService.createHabitacion(
        req.body
      );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Habitación creada correctamente",
      data: habitacion,
    });
  } catch (error) {
    next(error);
  }
};

export const updateHabitacion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habitacion =
      await habitacionService.updateHabitacion(
        Number(req.params.id),
        req.body
      );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Habitación actualizada correctamente",
      data: habitacion,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHabitacion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await habitacionService.deleteHabitacion(
      Number(req.params.id)
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Habitación eliminada correctamente",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};