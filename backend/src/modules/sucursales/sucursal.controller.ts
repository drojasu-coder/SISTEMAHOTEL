import { NextFunction, Request, Response } from "express";
import * as sucursalService from "./sucursal.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sucursales = await sucursalService.getAll();
    res.status(200).json({ status: "success", data: sucursales });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sucursal = await sucursalService.getById(Number(req.params.id));
    res.status(200).json({ status: "success", data: sucursal });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sucursal = await sucursalService.create(req.body);
    res.status(201).json({ status: "success", data: sucursal });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sucursal = await sucursalService.update(Number(req.params.id), req.body);
    res.status(200).json({ status: "success", data: sucursal });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sucursalService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const presignImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sedeId = Number(req.params.id);
    const userId = (req as any).user.id;
    const { contentType } = req.body;
    const result = await sucursalService.requestImageUpload(sedeId, userId, contentType);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const confirmImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sedeId = Number(req.params.id);
    const userId = (req as any).user.id;
    const { uploadToken, tempKey } = req.body;
    const sucursal = await sucursalService.confirmImageUpload(sedeId, userId, uploadToken, tempKey);
    res.status(200).json({ status: "success", data: sucursal });
  } catch (error) {
    next(error);
  }
};

export const removeImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sedeId = Number(req.params.id);
    const sucursal = await sucursalService.removeImage(sedeId);
    res.status(200).json({ status: "success", data: sucursal });
  } catch (error) {
    next(error);
  }
};
