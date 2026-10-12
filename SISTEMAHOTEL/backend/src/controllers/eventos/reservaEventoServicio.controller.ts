import {
  Request,
  Response,
} from "express";

import * as service
  from "../../services/eventos/reservaEventoServicio.service";

export const getAll = async (
  req: Request,
  res: Response
) => {
  const data =
    await service.getAll(
      Number(
        req.params.reservaId
      ),
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Servicios de la reserva obtenidos correctamente",
    data,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const data =
    await service.getById(
      Number(
        req.params.reservaId
      ),
      Number(req.params.id),
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Servicio de la reserva obtenido correctamente",
    data,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const data =
    await service.create(
      Number(
        req.params.reservaId
      ),
      req.body,
      req.user!.id,
      req.user!.rol
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      "Servicio agregado a la reserva correctamente",
    data,
  });
};

export const update = async (
  req: Request,
  res: Response
) => {
  const data =
    await service.update(
      Number(
        req.params.reservaId
      ),
      Number(req.params.id),
      req.body.cantidad,
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Servicio de la reserva actualizado correctamente",
    data,
  });
};

export const remove = async (
  req: Request,
  res: Response
) => {
  await service.remove(
    Number(
      req.params.reservaId
    ),
    Number(req.params.id),
    req.user!.id,
    req.user!.rol
  );

  res.status(204).send();
};

