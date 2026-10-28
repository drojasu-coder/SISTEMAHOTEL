import { NextFunction, Request, Response } from "express";
import * as dashboardService from "../../services/admin/dashboard.service";
import { z } from "zod";
import { AppError } from "../../utils/AppError";

const querySchema = z.object({
  sucursal_id: z.union([
    z.literal("all").transform(() => undefined),
    z.string().regex(/^[1-9]\d*$/).transform(Number).refine(value => Number.isSafeInteger(value) && value <= 2147483647),
  ]).optional(),
  vista: z.literal("alcance").optional(),
}).strict();

/** Sedes autorizadas del usuario para el selector global del panel (sin métricas). */
export const getScope = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await dashboardService.getAdminScope(req.user!);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ success: true, statusCode: 200, message: "Sedes autorizadas obtenidas correctamente", data });
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = querySchema.safeParse(req.query);
    if (!filters.success) throw new AppError(400, "VALIDATION_ERROR", "Los filtros del resumen no son válidos");
    const data = await dashboardService.getAdminDashboardData(filters.data, req.user!);

    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Dashboard administrativo obtenido correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};
