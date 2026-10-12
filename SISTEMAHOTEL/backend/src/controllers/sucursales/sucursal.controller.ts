import { Request, Response, NextFunction } from "express";
import * as sucursalService from "../../services/sucursales/sucursal.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sucursales = await sucursalService.getAll();
        res.status(200).json({status: "success", data: sucursales });

   } catch (error) {
    next(error);
   }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sucursal = await sucursalService.getById(Number(req.params.id));
        res.status(200).json({ status: "success", data: sucursal });
    } catch (error) {
        next(error);
    }
};


// para que sirve async
export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sucursal = await sucursalService.create(req.body);
        res.status(201).json({status: "success", data: sucursal });
    } catch (error) { 
        next(error);
    }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sucursal = await sucursalService.update(Number(req.params.id), req.body);
        res.status(200).json({status: "success", data: sucursal });
    } catch (error) {
        next(error);
    }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await sucursalService.remove(Number(req.params.id));
        res.status(204).send(); // 204 No content es estandar al borrar exitosamente

    } catch (error) {
        next(error);
    }
};
