import {
  Request,
  Response,
} from "express";

import * as salonService
  from "../../services/eventos/salon.service";

export const getAll = async (
  _req: Request,
  res: Response
) => {
  const salones =
    await salonService.getAll();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Salones obtenidos correctamente",
    data: salones,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const salon =
    await salonService.getById(
      Number(req.params.id)
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Salón obtenido correctamente",
    data: salon,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const salon =
    await salonService.create(
      req.body
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      "Salón creado correctamente",
    data: salon,
  });
};

export const update = async (
  req: Request,
  res: Response
) => {
  const salon =
    await salonService.update(
      Number(req.params.id),
      req.body
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Salón actualizado correctamente",
    data: salon,
  });
};

export const remove = async (
  req: Request,
  res: Response
) => {
  await salonService.remove(
    Number(req.params.id)
  );

  res.status(204).send();
};