import {
  Request,
  Response,
} from "express";

import * as vehiculoService
  from "../../services/transporte/vehiculo.service";

export const getAll = async (
  _req: Request,
  res: Response
) => {
  const vehiculos =
    await vehiculoService.getAll();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Vehículos obtenidos correctamente",
    data: vehiculos,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const vehiculo =
    await vehiculoService.getById(
      Number(req.params.id)
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Vehículo obtenido correctamente",
    data: vehiculo,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const vehiculo =
    await vehiculoService.create(
      req.body
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      "Vehículo creado correctamente",
    data: vehiculo,
  });
};

export const update = async (
  req: Request,
  res: Response
) => {
  const vehiculo =
    await vehiculoService.update(
      Number(req.params.id),
      req.body
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Vehículo actualizado correctamente",
    data: vehiculo,
  });
};

export const remove = async (
  req: Request,
  res: Response
) => {
  await vehiculoService.remove(
    Number(req.params.id)
  );

  res.status(204).send();
};