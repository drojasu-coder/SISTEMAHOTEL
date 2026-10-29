import { Request, Response, NextFunction } from "express";
import * as mesaService from "../../services/restaurante/mesa.service";
import { getSedeScope, parseSucursalIdQuery } from "../../utils/sedeScope";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // El catálogo es público, pero ahora respeta el filtro por sede (antes se ignoraba y devolvía las de todas las sedes).
    const sucursalId = parseSucursalIdQuery(req.query.sucursal_id);
    const mesas = await mesaService.getAll(sucursalId ? { sucursal_id: sucursalId } : {});
    res.status(200).json({ status: "success", data: mesas });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mesa = await mesaService.getById(Number(req.params.id));
    res.status(200).json({ status: "success", data: mesa });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mesa = await mesaService.create(req.body, await getSedeScope(req.user!));
    res.status(201).json({ status: "success", data: mesa });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mesa = await mesaService.update(Number(req.params.id), req.body, await getSedeScope(req.user!));
    res.status(200).json({ status: "success", data: mesa });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await mesaService.remove(Number(req.params.id), await getSedeScope(req.user!));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getConfiguracion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = mesaService.getBookingConfig();
    res.status(200).json({ status: "success", data });
  } catch (error) {
    next(error);
  }
};

export const getDisponibilidad = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mesaId = Number(req.params.id);
    const fecha = String(req.query.fecha);
    const data = await mesaService.getDisponibilidad(mesaId, fecha);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    next(error);
  }
};