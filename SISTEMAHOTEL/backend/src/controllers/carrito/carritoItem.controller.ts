import {
  Request,
  Response,
} from "express";

import * as carritoItemService
  from "../../services/carrito/carritoItem.service";

export const getAll = async (
  req: Request,
  res: Response
) => {
  const data =
    await carritoItemService.getAll(
      Number(
        req.params.carritoId
      ),
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Ítems del carrito obtenidos correctamente",
    data,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const item =
    await carritoItemService.getById(
      Number(
        req.params.carritoId
      ),
      Number(req.params.id),
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Ítem del carrito obtenido correctamente",
    data: item,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const item =
    await carritoItemService.create(
      Number(
        req.params.carritoId
      ),
      req.body,
      req.user!.id,
      req.user!.rol
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      "Ítem agregado al carrito correctamente",
    data: item,
  });
};

export const remove = async (
  req: Request,
  res: Response
) => {
  await carritoItemService.remove(
    Number(
      req.params.carritoId
    ),
    Number(req.params.id),
    req.user!.id,
    req.user!.rol
  );

  res.status(204).send();
};