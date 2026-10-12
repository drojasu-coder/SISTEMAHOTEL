import Stripe from "stripe";
import { AppError } from "../utils/AppError";

const minorUnits: Record<string, number> = { GTQ: 100 };

export const toStripeAmount = (amount: number | string, currency: string) => {
  const units = minorUnits[currency];
  if (!units) throw new AppError(422, "UNSUPPORTED_CURRENCY", "La moneda no es compatible con Stripe");
  const value = Number(amount);
  const result = Math.round(value * units);
  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new AppError(422, "INVALID_STRIPE_AMOUNT", "El monto no es válido para Stripe");
  }
  return result;
};

class StripeService {
  private client?: Stripe;

  private getClient() {
    if (!this.client) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) throw new AppError(503, "STRIPE_NOT_CONFIGURED", "Stripe no está configurado");
      if (process.env.NODE_ENV !== "production" && !key.startsWith("sk_test_")) {
        throw new AppError(503, "STRIPE_TEST_KEY_REQUIRED", "Stripe debe utilizar una clave de prueba");
      }
      this.client = new Stripe(key);
    }
    return this.client;
  }

  createPaymentIntent(amount: number | string, currency: string, metadata: Record<string, string>, idempotencyKey?: string) {
    return this.getClient().paymentIntents.create({
      amount: toStripeAmount(amount, currency),
      currency: currency.toLowerCase(),
      payment_method_types: ["card"],
      metadata,
    }, idempotencyKey ? { idempotencyKey } : undefined);
  }

  retrievePaymentIntent(id: string) { return this.getClient().paymentIntents.retrieve(id); }
  cancelPaymentIntent(id: string) { return this.getClient().paymentIntents.cancel(id); }

  createRefund(paymentIntentId: string, amount: number | string, currency: string, reason?: string, idempotencyKey?: string) {
    const params: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      amount: toStripeAmount(amount, currency),
    };
    if (reason && ["duplicate", "fraudulent", "requested_by_customer"].includes(reason)) {
      params.reason = reason as Stripe.RefundCreateParams.Reason;
    }
    return this.getClient().refunds.create(params, idempotencyKey ? { idempotencyKey } : undefined);
  }

  constructEvent(payload: Buffer, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new AppError(503, "STRIPE_WEBHOOK_NOT_CONFIGURED", "El webhook de Stripe no está configurado");
    try { return this.getClient().webhooks.constructEvent(payload, signature, secret); }
    catch { throw new AppError(400, "INVALID_STRIPE_SIGNATURE", "La firma del webhook de Stripe no es válida"); }
  }
}

export const stripeService = new StripeService();
