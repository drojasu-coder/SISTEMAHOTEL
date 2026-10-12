import {
  Request,
  Response,
} from "express";

import * as service
  from "../../services/transporte/reservaTransporte.service";

export const getAll = async (
  req: Request,
  res: Response
) => {
  const reservas =
    await service.getAll(
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Reservas de transporte obtenidas correctamente",
    data: reservas,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const reserva =
    await service.getById(
      Number(req.params.id),
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Reserva de transporte obtenida correctamente",
    data: reserva,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const reserva =
    await service.create(
      req.user!.id,
      req.body
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      reserva.estado ===
      "confirmada"
        ? "Reserva de transporte creada y asignada correctamente"
        : "Reserva de transporte creada y pendiente de asignación",
    data: reserva,
  });
};

export const update = async (
  req: Request,
  res: Response
) => {
  const reserva =
    await service.update(
      Number(req.params.id),
      req.body,
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Reserva de transporte actualizada correctamente",
    data: reserva,
  });
};

export const retryAssignment = async (
  req: Request,
  res: Response
) => {
  const reserva =
    await service.retryAssignment(
      Number(req.params.id)
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Chofer y vehículo asignados correctamente",
    data: reserva,
  });
};

export const cancel = async (
  req: Request,
  res: Response
) => {
  const reserva =
    await service.cancel(
      Number(req.params.id),
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Reserva de transporte cancelada correctamente",
    data: reserva,
  });
};