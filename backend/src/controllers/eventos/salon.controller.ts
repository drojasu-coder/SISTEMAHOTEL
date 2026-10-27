import {
  Request,
  Response,
  NextFunction,
} from "express";

import * as salonService
  from "../../services/eventos/salon.service";

export const getAll = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const salones =
      await salonService.getAll();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        "Salones obtenidos correctamente",
      data: salones,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const salon =
      await salonService.getById(
        Number(req.params.id)
      );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        "Salón obtenido correctamente",
      data: salon,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const salon =
      await salonService.create(
        req.body
      );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message:
        "Salón creado correctamente",
      data: salon,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const salon =
      await salonService.update(
        Number(req.params.id),
        req.body
      );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        "Salón actualizado correctamente",
      data: salon,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await salonService.remove(
      Number(req.params.id)
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const presignImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    const { contentType } = req.body;
    const result = await salonService.requestImageUpload(id, userId, contentType);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "URL de subida generada exitosamente",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    const { uploadToken, tempKey } = req.body;
    const salon = await salonService.confirmImageUpload(id, userId, uploadToken, tempKey);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Imagen confirmada exitosamente",
      data: salon,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const salon = await salonService.removeImage(id);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Imagen eliminada exitosamente",
      data: salon,
    });
  } catch (error) {
    next(error);
  }
};
