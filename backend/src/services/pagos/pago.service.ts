import Stripe from "stripe";
import { AppError } from "../../utils/AppError";

export const createPaymentIntent = async (monto: number) => {
  // 1. Verificamos que la llave exista
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError(500, "STRIPE_ERROR", "Falta configurar la llave de Stripe en el .env");
  }

  //esto inicializa stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-08-26.dahlia", 
  });

  // 3. Convertimos a centavos (ej. $150.50 -> 15050)
  const montoEnCentavos = Math.round(monto * 100);

  // 4. Creamos la intención de pago
  const paymentIntent = await stripe.paymentIntents.create({
    amount: montoEnCentavos,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
  });

  return paymentIntent.client_secret;
};