import { Request, Response, NextFunction } from "express";
import * as s3Service from "../../services/storage/s3.service";
import * as mediaUploadService from "../../services/storage/mediaUpload.service";

/**
 * Retorna las URLs prefirmadas de lectura para los logos de marca de HOTEL HUNAHPÚ.
 * Endpoint público para ser consumido en la portada y navegación pública sin autenticación previa.
 */
export const getBranding = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const branding = await s3Service.getBrandingUrls();
    res.status(200).json({
      status: "success",
      data: branding,
    });
  } catch (error) {
    next(error);
  }
};

export const presignBranding = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const variant = String(req.params.variant);
    const userId = (req as any).user.id;
    const { contentType } = req.body;
    const result = await mediaUploadService.requestBrandingUpload(variant, userId, contentType);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmBranding = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const variant = String(req.params.variant);
    const userId = (req as any).user.id;
    const { uploadToken, tempKey } = req.body;
    const updatedBranding = await mediaUploadService.confirmBrandingUpload(
      variant,
      userId,
      uploadToken,
      tempKey,
    );
    res.status(200).json({
      status: "success",
      data: updatedBranding,
    });
  } catch (error) {
    next(error);
  }
};
