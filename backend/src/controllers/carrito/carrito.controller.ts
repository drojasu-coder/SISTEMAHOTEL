import {
  Request,
  Response,
} from "express";

import * as carritoService
  from "../../services/carrito/carrito.service";

export const getAll = async (
  req: Request,
  res: Response
) => {
  const carritos =
    await carritoService.getAll(
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Carritos obtenidos correctamente",
    data: carritos,
  });
};

export const getCurrent = async (
  req: Request,
  res: Response
) => {
  const carrito =
    await carritoService.getCurrent(
      req.user!.id
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Carrito activo obtenido correctamente",
    data: carrito,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const carrito =
    await carritoService.getById(
      Number(req.params.id),
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Carrito obtenido correctamente",
    data: carrito,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const carrito =
    await carritoService.create(
      req.user!.id
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      "Carrito creado correctamente",
    data: carrito,
  });
};