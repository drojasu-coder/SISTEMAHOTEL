import {
  NextFunction,
  Request,
  Response,
} from "express";

import * as habitacionService from "../../services/habitaciones/habitacion.service";
import { getSedeScope, parseSucursalIdQuery } from "../../utils/sedeScope";

export const getAllHabitaciones = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habitaciones =
      await habitacionService.getAllHabitaciones(
        await getSedeScope(req.user!),
        parseSucursalIdQuery(req.query.sucursal_id)
      );

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
        Number(req.params.id),
        await getSedeScope(req.user!)
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
        req.body,
        await getSedeScope(req.user!)
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
        req.body,
        await getSedeScope(req.user!)
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
      Number(req.params.id),
      await getSedeScope(req.user!)
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
export const getHabitacionesDisponibles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habitaciones =
      await habitacionService.getHabitacionesDisponibles(
        req.query as unknown as habitacionService.DisponibilidadHabitacionQueryData
      );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Habitaciones disponibles obtenidas correctamente",
      data: habitaciones,
    });
  } catch (error) {
    next(error);
  }
};

export const presignImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await habitacionService.requestImageUpload(
      Number(req.params.id),
      req.user!.id,
      req.body.contentType,
      await getSedeScope(req.user!)
    );
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const confirmImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habitacion = await habitacionService.confirmImageUpload(
      Number(req.params.id),
      req.user!.id,
      req.body.uploadToken,
      req.body.tempKey,
      await getSedeScope(req.user!)
    );
    res.status(200).json({ status: "success", data: habitacion });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habitacion = await habitacionService.removeImage(
      Number(req.params.id),
      await getSedeScope(req.user!)
    );
    res.status(200).json({ status: "success", data: habitacion });
  } catch (error) {
    next(error);
  }
};
