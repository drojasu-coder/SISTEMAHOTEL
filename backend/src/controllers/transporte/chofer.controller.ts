import {
  Request,
  Response,
} from "express";

import * as choferService
  from "../../services/transporte/chofer.service";

export const getAll = async (
  _req: Request,
  res: Response
) => {
  const choferes =
    await choferService.getAll();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Choferes obtenidos correctamente",
    data: choferes,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const chofer =
    await choferService.getById(
      Number(req.params.id)
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Chofer obtenido correctamente",
    data: chofer,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const chofer =
    await choferService.create(
      req.body
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      "Chofer creado correctamente",
    data: chofer,
  });
};

export const update = async (
  req: Request,
  res: Response
) => {
  const chofer =
    await choferService.update(
      Number(req.params.id),
      req.body
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Chofer actualizado correctamente",
    data: chofer,
  });
};

export const updateStatus = async (
  req: Request,
  res: Response
) => {
  const chofer =
    await choferService.updateStatus(
      Number(req.params.id),
      req.body.activo
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Estado del chofer actualizado correctamente",
    data: chofer,
  });
};