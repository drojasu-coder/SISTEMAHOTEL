import { Request, Response, NextFunction } from "express";
import * as instructorService from "../../services/actividades/instructor.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instructores = await instructorService.getAll();
    res.status(200).json({ status: "success", data: instructores });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instructor = await instructorService.getById(Number(req.params.id));
    res.status(200).json({ status: "success", data: instructor });
  } catch (error) { next(error); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instructor = await instructorService.create(req.body);
    res.status(201).json({ status: "success", data: instructor });
  } catch (error) { next(error); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instructor = await instructorService.update(Number(req.params.id), req.body);
    res.status(200).json({ status: "success", data: instructor });
  } catch (error) { next(error); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await instructorService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (error) { next(error); }
};