import {
  Request,
  Response,
  NextFunction,
} from "express";

import * as reservaAmenidadService
  from "../../services/amenidades/reservaAmenidad.service";

export const getAll = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await reservaAmenidadService
        .getAll();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        "Reservas de amenidad obtenidas correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await reservaAmenidadService
        .getById(
          Number(
            req.params.id
          )
        );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        "Reserva de amenidad obtenida correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await reservaAmenidadService
        .create({
          ...req.body,

          usuario_id:
            req.user!.id,
        });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message:
        "Reserva de amenidad creada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await reservaAmenidadService
        .updateStatus(
          Number(
            req.params.id
          ),

          req.body.estado
        );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        "Estado de la reserva de amenidad actualizado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};