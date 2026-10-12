import {
  Request,
  Response,
  NextFunction,
} from "express";

import * as boletoParqueService
  from "../../services/parque/boletoParque.service";

export const getAll = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await boletoParqueService
        .getAll();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        "Boletos de parque obtenidos correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await boletoParqueService
        .getById(
          Number(
            req.params.id
          )
        );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        "Boleto de parque obtenido correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await boletoParqueService
        .create({
          ...req.body,

          usuario_id:
            req.user!.id,
        });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message:
        "Boleto de parque creado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await boletoParqueService
        .updateStatus(
          Number(
            req.params.id
          ),
          req.body.estado
        );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        "Estado del boleto actualizado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await boletoParqueService
      .remove(
        Number(
          req.params.id
        )
      );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};