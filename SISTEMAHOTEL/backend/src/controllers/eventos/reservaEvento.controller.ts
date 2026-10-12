import {
  Request,
  Response,
} from "express";

import * as reservaEventoService
  from "../../services/eventos/reservaEvento.service";

export const getAll = async (
  req: Request,
  res: Response
) => {
  const reservas =
    await reservaEventoService.getAll(
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Reservas de eventos obtenidas correctamente",
    data: reservas,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const reserva =
    await reservaEventoService.getById(
      Number(req.params.id),
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Reserva de evento obtenida correctamente",
    data: reserva,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const reserva =
    await reservaEventoService.create(
      req.user!.id,
      req.body
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      "Cotización de evento creada correctamente",
    data: reserva,
  });
};

export const update = async (
  req: Request,
  res: Response
) => {
  const reserva =
    await reservaEventoService.update(
      Number(req.params.id),
      req.body,
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Reserva de evento actualizada correctamente",
    data: reserva,
  });
};

export const cancel = async (
  req: Request,
  res: Response
) => {
  const reserva =
    await reservaEventoService.cancel(
      Number(req.params.id),
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Reserva de evento cancelada correctamente",
    data: reserva,
  });
};