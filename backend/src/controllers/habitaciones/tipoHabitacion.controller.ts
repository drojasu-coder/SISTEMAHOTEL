import {
  NextFunction,
  Request,
  Response,
} from "express";

import * as tipoHabitacionService
  from "../../services/habitaciones/tipoHabitacion.service";
import { ROLES } from "../../constants/roles";
import { getSedeScope, parseSucursalIdQuery } from "../../utils/sedeScope";

/**
 * Alcance por sede del personal. El cliente conserva la consulta de solo
 * lectura del catálogo (la usa al crear su reserva) y no recibe alcance.
 */
const staffScope = async (req: Request) =>
  req.user!.rol === ROLES.CLIENTE ? undefined : getSedeScope(req.user!);

export const getAllTipoHabitaciones = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tiposHabitacion =
      await tipoHabitacionService.getAllTipoHabitaciones(
        await staffScope(req),
        parseSucursalIdQuery(req.query.sucursal_id)
      );

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
        Number(req.params.id),
        await staffScope(req)
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
      await tipoHabitacionService.createTipoHabitacion(req.body, await getSedeScope(req.user!));

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
        req.body,
        await getSedeScope(req.user!)
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
      Number(req.params.id),
      await getSedeScope(req.user!)
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

export const presignImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await tipoHabitacionService.requestImageUpload(
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
    const tipo = await tipoHabitacionService.confirmImageUpload(
      Number(req.params.id),
      req.user!.id,
      req.body.uploadToken,
      req.body.tempKey,
      await getSedeScope(req.user!)
    );
    res.status(200).json({ status: "success", data: tipo });
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
    const tipo = await tipoHabitacionService.removeImage(
      Number(req.params.id),
      await getSedeScope(req.user!)
    );
    res.status(200).json({ status: "success", data: tipo });
  } catch (error) {
    next(error);
  }
};
