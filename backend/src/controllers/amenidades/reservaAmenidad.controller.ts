import { Request, Response, NextFunction } from "express";
import * as reservaAmenidadService from "../../services/amenidades/reservaAmenidad.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservas = await reservaAmenidadService.getAll();
    res.status(200).json({ status: "success", data: reservas });
  } catch (error) { 
    next(error); 
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await reservaAmenidadService.getById(Number(req.params.id));
    res.status(200).json({ status: "success", data: reserva });
  } catch (error) { 
    next(error); 
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Usamos 'any' de forma segura para extraer el id sin pelear con el tipado estricto global
    const userId = (req as any).user?.id;

    const reservaData = {
      ...req.body,
      usuario_id: userId 
    };

    const reserva = await reservaAmenidadService.create(reservaData);
    res.status(201).json({ status: "success", data: reserva });
  } catch (error) { 
    next(error); 
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await reservaAmenidadService.updateStatus(Number(req.params.id), req.body);
    res.status(200).json({ status: "success", data: reserva });
  } catch (error) { 
    next(error); 
  }
};