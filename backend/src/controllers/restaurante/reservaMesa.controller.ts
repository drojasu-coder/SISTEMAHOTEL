import {
  Request,
  Response,
  NextFunction,
} from "express";

import * as reservaMesaService from "../../services/restaurante/reservaMesa.service";

export const getAll =
  async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data =
        await reservaMesaService.getAll();

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

export const getById =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data =
        await reservaMesaService.getById(
          Number(
            req.params.id
          )
        );

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

export const getMine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await reservaMesaService.getMine(
        req.user!.id
      );

    res.status(200).json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMineById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await reservaMesaService.getMineById(
        req.user!.id,
        Number(req.params.id)
      );

    res.status(200).json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const create =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      /**
       * El propietario de la reserva
       * siempre procede del JWT.
       */
      const reservaData = {
        ...req.body,
        usuario_id:
          req.user!.id,
      };

      const data =
        await reservaMesaService.create(
          reservaData
        );

      res.status(201).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

export const updateStatus =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data =
        await reservaMesaService.updateStatus(
          Number(
            req.params.id
          ),
          req.body.estado
        );

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  };
