import { Request, Response, NextFunction } from "express";
import * as pagoService from "../../services/pagos/pago.service";

export const createIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { monto } = req.body;
        const clientSecret = await pagoService.createPaymentIntent(monto);

        res.status(200).json({ status: "success", data: { clientSecret } });
    }catch (error) { next(error); }
};