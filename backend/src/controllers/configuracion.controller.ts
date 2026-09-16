import { NextFunction, Request, Response } from "express";
import * as configuracionService from "../services/configuracion.service";

export const getCurrentIva = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const configuracion = await configuracionService.getCurrentIva();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Configuración del IVA obtenida correctamente",
      data: configuracion,
    });
  } catch (error) {
    next(error);
  }
};

export const updateIva = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configuracion = await configuracionService.updateIva(req.body.porcentaje_iva);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Configuración del IVA actualizada correctamente",
      data: configuracion,
    });
  } catch (error) {
    next(error);
  }
};
