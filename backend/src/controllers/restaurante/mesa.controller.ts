import { Request, Response, NextFunction } from "express";
import * as mesaService from "../../services/restaurante/mesa.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mesas = await mesaService.getAll();
    res.status(200).json({ status: "success", data: mesas });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mesa = await mesaService.getById(Number(req.params.id));
    res.status(200).json({ status: "success", data: mesa });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mesa = await mesaService.create(req.body);
    res.status(201).json({ status: "success", data: mesa });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mesa = await mesaService.update(Number(req.params.id), req.body);
    res.status(200).json({ status: "success", data: mesa });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await mesaService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};