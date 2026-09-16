import { NextFunction, Request, Response } from "express";
import * as cuentaPorPagarService from "../../services/proveedores/cuentaPorPagar.service";

export const getAllCuentasPorPagar = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cuentasPorPagar = await cuentaPorPagarService.getAllCuentasPorPagar();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Cuentas por pagar obtenidas correctamente",
      data: cuentasPorPagar,
    });
  } catch (error) {
    next(error);
  }
};

export const getCuentaPorPagarById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cuentaPorPagar = await cuentaPorPagarService.getCuentaPorPagarById(
      Number(req.params.id),
    );
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Cuenta por pagar obtenida correctamente",
      data: cuentaPorPagar,
    });
  } catch (error) {
    next(error);
  }
};

export const createCuentaPorPagar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cuentaPorPagar = await cuentaPorPagarService.createCuentaPorPagar(
      req.body,
    );
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Cuenta por pagar creada correctamente",
      data: cuentaPorPagar,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCuentaPorPagar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cuentaPorPagar = await cuentaPorPagarService.updateCuentaPorPagar(
      Number(req.params.id),
      req.body,
    );
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Cuenta por pagar actualizada correctamente",
      data: cuentaPorPagar,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCuentaPorPagar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await cuentaPorPagarService.deleteCuentaPorPagar(Number(req.params.id));
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Cuenta por pagar eliminada correctamente",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
