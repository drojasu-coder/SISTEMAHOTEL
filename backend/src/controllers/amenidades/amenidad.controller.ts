import { Request, Response, NextFunction } from "express";
import * as amenidadService from "../../services/amenidades/amenidad.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amenidades = await amenidadService.getAll();
    res.status(200).json({ status: "success", data: amenidades });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amenidad = await amenidadService.getById(Number(req.params.id));
    res.status(200).json({ status: "success", data: amenidad });
  } catch (error) { next(error); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amenidad = await amenidadService.create(req.body);
    res.status(201).json({ status: "success", data: amenidad });
  } catch (error) { next(error); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amenidad = await amenidadService.update(Number(req.params.id), req.body);
    res.status(200).json({ status: "success", data: amenidad });
  } catch (error) { next(error); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await amenidadService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (error) { next(error); }
};