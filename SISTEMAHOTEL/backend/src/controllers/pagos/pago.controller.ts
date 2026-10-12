import { NextFunction, Request, Response } from "express";
import * as pagoService from "../../services/pago.service";
import { stripeService } from "../../services/stripe.service";
import Stripe from "stripe";
import { AppError } from "../../utils/AppError";

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result: any = await pagoService.createPago(req.body, req.user!);
    const pago = result.payment ?? result;
    const data = result.intent ? {
      pago_id: pago.id,
      payment_intent_id: result.intent.id,
      client_secret: result.intent.client_secret,
      estado: pago.estado,
      monto: pago.monto,
      moneda: pago.moneda,
    } : pago;
    res.status(201).json({ success: true, statusCode: 201, message: "Pago creado correctamente", data });
  } catch (error) { next(error); }
};

export const stripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string" || !Buffer.isBuffer(req.body)) {
      throw new AppError(400, "INVALID_WEBHOOK_REQUEST", "La solicitud del webhook no es válida");
    }
    const event = stripeService.constructEvent(req.body, signature);
    const intentEvents = ["payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.canceled"];
    const refundEvents = ["refund.created", "refund.updated", "refund.failed"];

    if (intentEvents.includes(event.type) || refundEvents.includes(event.type)) {
      await pagoService.processStripeWebhook(event.data.object as any, event.type);
    }
    res.status(200).json({ received: true });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pago = await pagoService.getPagoById(Number(req.params.id), req.user!);
    res.status(200).json({ success: true, statusCode: 200, message: "Pago obtenido correctamente", data: pago });
  } catch (error) { next(error); }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagos = await pagoService.getPagos(req.query as Record<string, string>, req.user!);
    res.status(200).json({ success: true, statusCode: 200, message: "Pagos obtenidos correctamente", data: pagos });
  } catch (error) { next(error); }
};

export const resumen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await pagoService.getResumenPago({
      carrito_id: req.query.carrito_id ? Number(req.query.carrito_id) : undefined,
      reserva_habitacion_id: req.query.reserva_habitacion_id ? Number(req.query.reserva_habitacion_id) : undefined,
    }, req.user!);
    res.status(200).json({ success: true, statusCode: 200, message: "Resumen de pago obtenido correctamente", data });
  } catch (error) { next(error); }
};

export const aprobarTransferencia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pago = await pagoService.approveTransferencia(Number(req.params.id));
    res.status(200).json({ success: true, statusCode: 200, message: "Transferencia aprobada correctamente", data: pago });
  } catch (error) { next(error); }
};

export const reembolso = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await pagoService.createReembolso(Number(req.params.id), req.body, req.user!);
    res.status(200).json({ success: true, statusCode: 200, message: "Reembolso procesado correctamente", data });
  } catch (error) { next(error); }
};
