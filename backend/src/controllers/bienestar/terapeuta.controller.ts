import { Request, Response, NextFunction } from "express";
import * as terapeutaService from "../../services/bienestar/terapeuta.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await terapeutaService.getAll();
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await terapeutaService.getById(Number(req.params.id));
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await terapeutaService.create(req.body);
    res.status(201).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await terapeutaService.update(Number(req.params.id), req.body);
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await terapeutaService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (error) { next(error); }
};