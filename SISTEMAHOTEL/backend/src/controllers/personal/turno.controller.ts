import {
  Request,
  Response,
} from "express";

import * as turnoService
  from "../../services/personal/turno.service";

export const getAll = async (
  _req: Request,
  res: Response
) => {
  const turnos =
    await turnoService.getAll();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Turnos obtenidos correctamente",
    data: turnos,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const turno =
    await turnoService.getById(
      Number(req.params.id)
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Turno obtenido correctamente",
    data: turno,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const turno =
    await turnoService.create(
      req.body
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      "Turno creado correctamente",
    data: turno,
  });
};

export const update = async (
  req: Request,
  res: Response
) => {
  const turno =
    await turnoService.update(
      Number(req.params.id),
      req.body
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Turno actualizado correctamente",
    data: turno,
  });
};

export const remove = async (
  req: Request,
  res: Response
) => {
  await turnoService.remove(
    Number(req.params.id)
  );

  res.status(204).send();
};