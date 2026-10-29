import { getEstadoCarritoReferencia, type TipoReferenciaConEstado } from "../../services/carrito/carritoItem.service";
import {
  Request,
  Response,
} from "express";

import * as carritoService
  from "../../services/carrito/carrito.service";

export const getAll = async (
  req: Request,
  res: Response
) => {
  const carritos =
    await carritoService.getAll(
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Carritos obtenidos correctamente",
    data: carritos,
  });
};

/** GET /api/carritos/estado-referencia — solo lectura, para el titular de la reserva. */
export const getEstadoReferencia = async (
  req: Request,
  res: Response
) => {
  const { tipo_item, referencia_id } = req.query as unknown as { tipo_item: TipoReferenciaConEstado; referencia_id: number };
  const data = await getEstadoCarritoReferencia(tipo_item, referencia_id, req.user!.id);
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Estado de la reserva obtenido correctamente",
    data,
  });
};

export const getCurrent = async (
  req: Request,
  res: Response
) => {
  const carrito =
    await carritoService.getCurrent(
      req.user!.id
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Carrito activo obtenido correctamente",
    data: carrito,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const carrito =
    await carritoService.getById(
      Number(req.params.id),
      req.user!.id,
      req.user!.rol
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Carrito obtenido correctamente",
    data: carrito,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const carrito =
    await carritoService.create(
      req.user!.id
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      "Carrito creado correctamente",
    data: carrito,
  });
};