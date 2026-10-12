import { NextFunction, Request, Response } from "express";
import * as proveedorProductoService from "../../services/proveedores/proveedorProducto.service";

export const getAllProveedorProductos = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const proveedorProductos =
      await proveedorProductoService.getAllProveedorProductos();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Productos de proveedores obtenidos correctamente",
      data: proveedorProductos,
    });
  } catch (error) {
    next(error);
  }
};

export const getProveedorProductoById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const proveedorProducto =
      await proveedorProductoService.getProveedorProductoById(
        Number(req.params.id),
      );
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Producto del proveedor obtenido correctamente",
      data: proveedorProducto,
    });
  } catch (error) {
    next(error);
  }
};

export const createProveedorProducto = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const proveedorProducto =
      await proveedorProductoService.createProveedorProducto(req.body);
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Producto del proveedor creado correctamente",
      data: proveedorProducto,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProveedorProducto = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const proveedorProducto =
      await proveedorProductoService.updateProveedorProducto(
        Number(req.params.id),
        req.body,
      );
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Producto del proveedor actualizado correctamente",
      data: proveedorProducto,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProveedorProducto = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await proveedorProductoService.deleteProveedorProducto(
      Number(req.params.id),
    );
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Producto del proveedor eliminado correctamente",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
