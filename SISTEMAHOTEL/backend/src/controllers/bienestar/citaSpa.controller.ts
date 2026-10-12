import { Request, Response, NextFunction } from "express";
import * as service from "../../services/bienestar/citaSpa.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getAll();
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getById(Number(req.params.id));
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const citaData = { ...req.body, usuario_id: userId };
    const data = await service.create(citaData);
    res.status(201).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.updateStatus(Number(req.params.id), req.body);
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};