import {
  Request,
  Response,
} from "express";

import * as empleadoService
  from "../../services/personal/empleado.service";

export const getAll = async (
  _req: Request,
  res: Response
) => {
  const empleados =
    await empleadoService.getAll();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Empleados obtenidos correctamente",
    data: empleados,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const empleado =
    await empleadoService.getById(
      Number(req.params.id)
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Empleado obtenido correctamente",
    data: empleado,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const empleado =
    await empleadoService.create(
      req.body
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      "Empleado creado correctamente",
    data: empleado,
  });
};

export const update = async (
  req: Request,
  res: Response
) => {
  const empleado =
    await empleadoService.update(
      Number(req.params.id),
      req.body
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Empleado actualizado correctamente",
    data: empleado,
  });
};

export const remove = async (
  req: Request,
  res: Response
) => {
  await empleadoService.remove(
    Number(req.params.id)
  );

  res.status(204).send();
};