import {
  Request,
  Response,
  NextFunction,
} from "express";

import * as reservaMesaService from "../../services/restaurante/reservaMesa.service";
import { getSedeScope, parseSucursalIdQuery } from "../../utils/sedeScope";

export const getAll =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data =
        await reservaMesaService.getAll(
          await getSedeScope(req.user!),
          parseSucursalIdQuery(req.query.sucursal_id)
        );

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

export const getMyReservations =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data =
        await reservaMesaService.getByUserId(
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

export const getMyReservationById =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data =
        await reservaMesaService.getByIdForUser(
          Number(
            req.params.id
          ),
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

export const cancelMyReservation =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data =
        await reservaMesaService.cancelForUser(
          Number(
            req.params.id
          ),
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

export const getDisponibilidad =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data =
        await reservaMesaService.getDisponibilidadMesa(
          Number(req.query.mesa_id),
          String(req.query.fecha)
        );

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

