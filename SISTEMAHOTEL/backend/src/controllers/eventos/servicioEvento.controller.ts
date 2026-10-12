import {
  Request,
  Response,
} from "express";

import * as servicioEventoService
  from "../../services/eventos/servicioEvento.service";

export const getAll = async (
  _req: Request,
  res: Response
) => {
  const servicios =
    await servicioEventoService.getAll();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Servicios de evento obtenidos correctamente",
    data: servicios,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);

  const servicio =
    await servicioEventoService.getById(id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Servicio de evento obtenido correctamente",
    data: servicio,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const servicio =
    await servicioEventoService.create(
      req.body
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      "Servicio de evento creado correctamente",
    data: servicio,
  });
};

export const update = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);

  const servicio =
    await servicioEventoService.update(
      id,
      req.body
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Servicio de evento actualizado correctamente",
    data: servicio,
  });
};

export const remove = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);

  await servicioEventoService.remove(id);

  res.status(204).send();
};