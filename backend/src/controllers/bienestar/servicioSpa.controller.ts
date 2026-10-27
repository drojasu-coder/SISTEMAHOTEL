import { Request, Response, NextFunction } from "express";
import * as service from "../../services/bienestar/servicioSpa.service";

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
    const data = await service.create(req.body);
    res.status(201).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.update(Number(req.params.id), req.body);
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.remove(Number(req.params.id));
    res.status(204).send();
  } catch (error) { next(error); }
};

export const presignImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    const { contentType } = req.body;
    const result = await service.requestImageUpload(id, userId, contentType);
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
    const result = await service.confirmImageUpload(id, userId, uploadToken, tempKey);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const result = await service.removeImage(id);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};
