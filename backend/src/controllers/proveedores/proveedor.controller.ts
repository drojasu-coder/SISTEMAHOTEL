import { NextFunction, Request, Response } from "express";
import * as proveedorService from "../../services/proveedores/proveedor.service";

export const getAllProveedores = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const proveedores = await proveedorService.getAllProveedores();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Proveedores obtenidos correctamente",
      data: proveedores,
    });
  } catch (error) {
    next(error);
  }
};

export const getProveedorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const proveedor = await proveedorService.getProveedorById(Number(req.params.id));
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Proveedor obtenido correctamente",
      data: proveedor,
    });
  } catch (error) {
    next(error);
  }
};

export const createProveedor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const proveedor = await proveedorService.createProveedor(req.body);
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Proveedor creado correctamente",
      data: proveedor,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProveedor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const proveedor = await proveedorService.updateProveedor(
      Number(req.params.id),
      req.body
    );
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Proveedor actualizado correctamente",
      data: proveedor,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProveedor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await proveedorService.deleteProveedor(Number(req.params.id));
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Proveedor eliminado correctamente",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
