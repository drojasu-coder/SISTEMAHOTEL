import { NextFunction, Request, Response } from "express";
import * as facturaItemService from "../../services/habitaciones/facturaItem.service";

export const getAllFacturaItems = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const facturaItems = await facturaItemService.getAllFacturaItems();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Items de factura obtenidos correctamente",
      data: facturaItems,
    });
  } catch (error) {
    next(error);
  }
};

export const getFacturaItemById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const facturaItem = await facturaItemService.getFacturaItemById(
      Number(req.params.id)
    );
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Item de factura obtenido correctamente",
      data: facturaItem,
    });
  } catch (error) {
    next(error);
  }
};

export const createFacturaItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const facturaItem = await facturaItemService.createFacturaItem(req.body);
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Item de factura creado correctamente",
      data: facturaItem,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFacturaItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const facturaItem = await facturaItemService.updateFacturaItem(
      Number(req.params.id),
      req.body
    );
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Item de factura actualizado correctamente",
      data: facturaItem,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFacturaItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await facturaItemService.deleteFacturaItem(Number(req.params.id));
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Item de factura eliminado correctamente",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
