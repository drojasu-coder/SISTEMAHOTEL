import { NextFunction, Request, Response } from "express";
import * as facturaService from "../../services/habitaciones/factura.service";

export const getAllFacturas = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const facturas = await facturaService.getAllFacturas();
    res.status(200).json({ success: true, statusCode: 200, message: "Facturas obtenidas correctamente", data: facturas });
  } catch (error) { next(error); }
};

export const getFacturaById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factura = await facturaService.getFacturaById(Number(req.params.id));
    res.status(200).json({ success: true, statusCode: 200, message: "Factura obtenida correctamente", data: factura });
  } catch (error) { next(error); }
};

export const createFactura = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factura = await facturaService.createFactura(req.body);
    res.status(201).json({ success: true, statusCode: 201, message: "Factura creada correctamente", data: factura });
  } catch (error) { next(error); }
};

export const updateFactura = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factura = await facturaService.updateFactura(Number(req.params.id), req.body);
    res.status(200).json({ success: true, statusCode: 200, message: "Factura actualizada correctamente", data: factura });
  } catch (error) { next(error); }
};

export const deleteFactura = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await facturaService.deleteFactura(Number(req.params.id));
    res.status(200).json({ success: true, statusCode: 200, message: "Factura eliminada correctamente", data: null });
  } catch (error) { next(error); }
};
