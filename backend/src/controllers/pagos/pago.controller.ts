import { Request, Response } from "express";
import * as pagoService from "../../services/pagos/pago.service";

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { tipoModulo, itemId } = req.body; // ya validado por el middleware
    const usuarioId = (req as any).user.id; // ajusta al nombre real que use tu authMiddleware

    const clientSecret = await pagoService.createPaymentIntent(tipoModulo, itemId, usuarioId);

    res.status(200).json({ success: true, data: { clientSecret } });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const webhookStripe = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string;
    await pagoService.procesarWebhook(req.body, signature);
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    const statusCode = error.statusCode || 400;
    res.status(statusCode).send(`Webhook Error: ${error.message}`);
  }
};