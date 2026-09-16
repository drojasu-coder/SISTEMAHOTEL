import { Request, Response, NextFunction } from "express";
import * as recursoService from "../../services/actividades/recursoActividad.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recursos = await recursoService.getAll();
    res.status(200).json({ status: "success", data: recursos });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recurso = await recursoService.getById(Number(req.params.id));
    res.status(200).json({ status: "success", data: recurso });
  } catch (error) { next(error); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recurso = await recursoService.create(req.body);
    res.status(201).json({ status: "success", data: recurso });
  } catch (error) { next(error); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recurso = await recursoService.update(Number(req.params.id), req.body);
    res.status(200).json({ status: "success", data: recurso });
  } catch (error) { next(error); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await recursoService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (error) { next(error); }
};