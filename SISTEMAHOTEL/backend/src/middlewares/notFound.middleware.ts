import {RequestHandler } from "express";
import { AppError } from "../utils/AppError";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new AppError(
      404,
      "ROUTE_NOT_FOUND",
      `La ruta ${req.method} ${req.originalUrl} no existe`
    )
  );
};