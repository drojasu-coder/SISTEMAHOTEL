import { Request, Response, NextFunction } from "express";
import * as restauranteService from "../../services/restaurante/restaurante.service";
import { getSedeScope } from "../../utils/sedeScope";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sucursal_id } = req.query as { sucursal_id?: number };
    const data = await restauranteService.getAll({ sucursalId: sucursal_id });
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await restauranteService.getById(Number(req.params.id));
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const getMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoria, incluir_no_disponibles } = req.query as { categoria?: any; incluir_no_disponibles?: string };
    const data = await restauranteService.getMenu(Number(req.params.id), categoria, incluir_no_disponibles === "true");
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const getProductosAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await restauranteService.getProductosAdmin(Number(req.params.id), await getSedeScope(req.user!));
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const createProducto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await restauranteService.createProducto(Number(req.params.id), req.body, await getSedeScope(req.user!));
    res.status(201).json({ status: "success", data });
  } catch (error) { next(error); }
};

export const updateProducto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await restauranteService.updateProducto(Number(req.params.productoId), req.body, await getSedeScope(req.user!));
    res.status(200).json({ status: "success", data });
  } catch (error) { next(error); }
};
