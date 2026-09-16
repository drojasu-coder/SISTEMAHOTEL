import {
  NextFunction,
  Request,
  Response,
} from "express";

import * as tipoHabitacionService
  from "../../services/habitaciones/tipoHabitacion.service";

export const getAllTipoHabitaciones = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tiposHabitacion =
      await tipoHabitacionService.getAllTipoHabitaciones();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Tipos de habitación obtenidos correctamente",
      data: tiposHabitacion,
    });
  } catch (error) {
    next(error);
  }
};

export const getTipoHabitacionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tipoHabitacion =
      await tipoHabitacionService.getTipoHabitacionById(
        Number(req.params.id)
      );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Tipo de habitación obtenido correctamente",
      data: tipoHabitacion,
    });
  } catch (error) {
    next(error);
  }
};

export const createTipoHabitacion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tipoHabitacion =
      await tipoHabitacionService.createTipoHabitacion(req.body);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Tipo de habitación creado correctamente",
      data: tipoHabitacion,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTipoHabitacion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tipoHabitacion =
      await tipoHabitacionService.updateTipoHabitacion(
        Number(req.params.id),
        req.body
      );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Tipo de habitación actualizado correctamente",
      data: tipoHabitacion,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTipoHabitacion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await tipoHabitacionService.deleteTipoHabitacion(
      Number(req.params.id)
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Tipo de habitación eliminado correctamente",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
