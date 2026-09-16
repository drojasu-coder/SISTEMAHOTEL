import { Request, Response, NextFunction } from "express";
import * as reservaMesaService from "../../services/restaurante/reservaMesa.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reservaMesaService.getAll();
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reservaMesaService.getById(Number(req.params.id));
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const reservaData = { ...req.body, usuario_id: userId };
    
    const data = await reservaMesaService.create(reservaData);
    res.status(201).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await reservaMesaService.updateStatus(
        Number(req.params.id),
        req.body.estado
      );

    res.status(200).json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
};