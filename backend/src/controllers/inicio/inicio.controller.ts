import { Request, Response, NextFunction } from "express";
import * as inicioService from "../../services/inicio/inicio.service";

export const getInicio = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await inicioService.getInicioContent();
    res.status(200).json({
      status: "success",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const updateInicio = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await inicioService.updateInicioContent(req.body);
    res.status(200).json({
      status: "success",
      message: "Contenido de inicio actualizado correctamente",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const presignImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const section = String(req.params.section);
    const userId = (req as any).user.id;
    const { contentType, fileName } = req.body;
    const data = await inicioService.requestInicioImageUpload(
      section,
      userId,
      contentType,
      fileName,
    );
    res.status(200).json({
      status: "success",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const confirmImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const section = String(req.params.section);
    const userId = (req as any).user.id;
    const { uploadToken, tempKey } = req.body;
    const data = await inicioService.confirmInicioImageUpload(
      section,
      userId,
      uploadToken,
      tempKey,
    );
    res.status(200).json({
      status: "success",
      message: "Imagen de inicio actualizada correctamente",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const removeImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const section = String(req.params.section);
    const data = await inicioService.removeInicioImage(section);
    res.status(200).json({
      status: "success",
      message: "Imagen de inicio eliminada correctamente",
      data,
    });
  } catch (err) {
    next(err);
  }
};
