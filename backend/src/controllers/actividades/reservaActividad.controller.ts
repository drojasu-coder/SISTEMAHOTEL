import { Request, Response, NextFunction } from "express";
import * as reservaActividadService from "../../services/actividades/reservaActividad.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservas = await reservaActividadService.getAll();
    res.status(200).json({ status: "success", data: reservas });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await reservaActividadService.getById(Number(req.params.id));
    res.status(200).json({ status: "success", data: reserva });
  } catch (error) { next(error); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Inyectamos el usuario que está haciendo la petición desde el Token
    const reservaData = {
      ...req.body,
      usuario_id: req.user?.id 
    };

    const reserva = await reservaActividadService.create(reservaData);
    res.status(201).json({ status: "success", data: reserva });
  } catch (error) { next(error); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await reservaActividadService.update(Number(req.params.id), req.body);
    res.status(200).json({ status: "success", data: reserva });
  } catch (error) { next(error); }
};