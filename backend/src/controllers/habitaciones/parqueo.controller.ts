import { NextFunction, Request, Response } from "express";
import * as parqueoService from "../../services/habitaciones/parqueo.service";
import { getSedeScope, parseSucursalIdQuery } from "../../utils/sedeScope";

export const getAllParqueos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sucursalId = parseSucursalIdQuery(req.query.sucursal_id);
    const parqueos = await parqueoService.getAllParqueos(await getSedeScope(req.user!), sucursalId);
    res.status(200).json({ success: true, statusCode: 200, message: "Parqueos obtenidos correctamente", data: parqueos });
  } catch (error) { next(error); }
};

export const getParqueoById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parqueo = await parqueoService.getParqueoById(Number(req.params.id), await getSedeScope(req.user!));
    res.status(200).json({ success: true, statusCode: 200, message: "Parqueo obtenido correctamente", data: parqueo });
  } catch (error) { next(error); }
};

export const createParqueo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parqueo = await parqueoService.createParqueo(req.body, await getSedeScope(req.user!));
    res.status(201).json({ success: true, statusCode: 201, message: "Parqueo creado correctamente", data: parqueo });
  } catch (error) { next(error); }
};

export const updateParqueo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parqueo = await parqueoService.updateParqueo(Number(req.params.id), req.body, await getSedeScope(req.user!));
    res.status(200).json({ success: true, statusCode: 200, message: "Parqueo actualizado correctamente", data: parqueo });
  } catch (error) { next(error); }
};

export const deleteParqueo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await parqueoService.deleteParqueo(Number(req.params.id), await getSedeScope(req.user!));
    res.status(200).json({ success: true, statusCode: 200, message: "Parqueo eliminado correctamente", data: null });
  } catch (error) { next(error); }
};
