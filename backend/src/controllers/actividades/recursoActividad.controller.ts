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

export const presignImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    const { contentType } = req.body;
    const result = await recursoService.requestImageUpload(id, userId, contentType);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const confirmImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    const { uploadToken, tempKey } = req.body;
    const recurso = await recursoService.confirmImageUpload(id, userId, uploadToken, tempKey);
    res.status(200).json({ status: "success", data: recurso });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const recurso = await recursoService.removeImage(id);
    res.status(200).json({ status: "success", data: recurso });
  } catch (error) {
    next(error);
  }
};

export const getSalidas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instructorId = req.query.instructor_id ? Number(req.query.instructor_id) : undefined;
    const data = await recursoService.getSalidas(Number(req.params.id), String(req.query.fecha), instructorId);
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};
