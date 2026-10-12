import { NextFunction, Request, Response } from "express";
import * as promocionService from "../../services/habitaciones/promocion.service";

export const getAllPromociones = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const promociones = await promocionService.getAllPromociones();
    res.status(200).json({ success: true, statusCode: 200, message: "Promociones obtenidas correctamente", data: promociones });
  } catch (error) { next(error); }
};

export const getPromocionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const promocion = await promocionService.getPromocionById(Number(req.params.id));
    res.status(200).json({ success: true, statusCode: 200, message: "Promoción obtenida correctamente", data: promocion });
  } catch (error) { next(error); }
};

export const createPromocion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const promocion = await promocionService.createPromocion(req.body);
    res.status(201).json({ success: true, statusCode: 201, message: "Promoción creada correctamente", data: promocion });
  } catch (error) { next(error); }
};

export const updatePromocion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const promocion = await promocionService.updatePromocion(Number(req.params.id), req.body);
    res.status(200).json({ success: true, statusCode: 200, message: "Promoción actualizada correctamente", data: promocion });
  } catch (error) { next(error); }
};

export const deletePromocion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await promocionService.deletePromocion(Number(req.params.id));
    res.status(200).json({ success: true, statusCode: 200, message: "Promoción eliminada correctamente", data: null });
  } catch (error) { next(error); }
};
