import Stripe from "stripe";
import { AppError } from "../../utils/AppError";
import { MODULOS_PAGO } from "./pago.config";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError(500, "STRIPE_ERROR", "Falta llave de Stripe en el .env");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-08-26.dahlia",
  });
};

// 1. CREAR INTENCION DE PAGO — el monto se calcula SIEMPRE desde la BD
export const createPaymentIntent = async (
  tipoModulo: string,
  itemId: number,
  usuarioId: number
) => {
  const config = MODULOS_PAGO[tipoModulo];
  if (!config) {
    throw new AppError(400, "MODULO_INVALIDO", `Modulo de pago no soportado: ${tipoModulo}`);
  }

  const registro = await config.buscarRegistro(itemId);
  if (!registro) {
    throw new AppError(404, "NOT_FOUND", "El recurso a pagar no existe");
  }

  // Verifica que el usuario autenticado sea el dueño del recurso
  if (registro.usuario_id !== usuarioId) {
    throw new AppError(403, "FORBIDDEN", "No puedes pagar un recurso que no te pertenece");
  }

  const estadoActual = registro[config.campoEstado];
  if (!config.estadosValidosParaCobrar.includes(estadoActual)) {
    throw new AppError(
      409,
      "ESTADO_INVALIDO",
      `No se puede cobrar un registro en estado "${estadoActual}"`
    );
  }

  const monto = config.obtenerMonto(registro);
  if (!monto || monto <= 0) {
    throw new AppError(500, "MONTO_INVALIDO", "El monto calculado no es valido");
  }

  const stripe = getStripe();
  const montoEnCentavos = Math.round(monto * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: montoEnCentavos,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      tipoModulo,
      itemId: String(itemId),
    },
  });

  return paymentIntent.client_secret;
};

// 2. PROCESAR WEBHOOK — genérico para cualquier módulo registrado en la config
export const procesarWebhook = async (rawBody: Buffer | string, signature: string) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError(500, "STRIPE_ERROR", "Faltan llaves de Webhook en .env");
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    throw new AppError(400, "WEBHOOK_ERROR", `Firma invalida: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { tipoModulo, itemId } = paymentIntent.metadata;

      const config = MODULOS_PAGO[tipoModulo];
      if (!config) {
        console.log(`[WEBHOOK] tipoModulo desconocido en metadata: ${tipoModulo}`);
        break;
      }

      // El where con el estado válido hace la actualización idempotente:
      // si Stripe reenvía el mismo evento, la segunda vez no afecta filas.
      const [filasActualizadas] = await config.model.update(
        { [config.campoEstado]: config.estadoTrasPago },
        {
          where: {
            id: Number(itemId),
            [config.campoEstado]: config.estadosValidosParaCobrar,
          },
        }
      );

      if (filasActualizadas === 0) {
        console.log(`[WEBHOOK] ${tipoModulo} #${itemId} ya estaba procesado o no coincide el estado`);
      } else {
        console.log(`[WEBHOOK] ${tipoModulo} #${itemId} marcado como pagado ($${paymentIntent.amount / 100})`);
      }
      break;
    }

    case "payment_intent.payment_failed":
      console.log("ERROR: El pago fallo o fue rechazado por el banco.");
      break;

    default:
      console.log(`Evento ignorado: ${event.type}`);
  }

  return true;
};