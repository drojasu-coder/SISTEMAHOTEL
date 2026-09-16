import { NextFunction, Request, Response } from "express";
import * as reservaParqueoService from "../../services/habitaciones/reservaParqueo.service";

export const getAllReservaParqueos = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const reservas = await reservaParqueoService.getAllReservaParqueos();
    res.status(200).json({ success: true, statusCode: 200, message: "Reservas de parqueo obtenidas correctamente", data: reservas });
  } catch (error) { next(error); }
};

export const getReservaParqueoById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await reservaParqueoService.getReservaParqueoById(Number(req.params.id));
    res.status(200).json({ success: true, statusCode: 200, message: "Reserva de parqueo obtenida correctamente", data: reserva });
  } catch (error) { next(error); }
};

export const createReservaParqueo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await reservaParqueoService.createReservaParqueo(req.body);
    res.status(201).json({ success: true, statusCode: 201, message: "Reserva de parqueo creada correctamente", data: reserva });
  } catch (error) { next(error); }
};

export const updateReservaParqueo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await reservaParqueoService.updateReservaParqueo(Number(req.params.id), req.body);
    res.status(200).json({ success: true, statusCode: 200, message: "Reserva de parqueo actualizada correctamente", data: reserva });
  } catch (error) { next(error); }
};

export const deleteReservaParqueo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await reservaParqueoService.deleteReservaParqueo(Number(req.params.id));
    res.status(200).json({ success: true, statusCode: 200, message: "Reserva de parqueo eliminada correctamente", data: reserva });
  } catch (error) { next(error); }
};
