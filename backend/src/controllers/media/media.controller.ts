import { Request, Response, NextFunction } from "express";
import * as s3Service from "../../services/storage/s3.service";

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
