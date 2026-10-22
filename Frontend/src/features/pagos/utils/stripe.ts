import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { env } from '@/app/config/env';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Obtiene la instancia singleton oficial del SDK de Stripe en el navegador.
 * Requiere VITE_STRIPE_PUBLISHABLE_KEY configurada con una clave pública de prueba (pk_test_...).
 * Retorna null si la clave no está configurada, evitando fallos en tiempo de ejecución.
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const key = env.stripePublishableKey;
    if (!key) {
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

/**
 * Helper para pruebas y reset controlado.
 */
export const _resetStripePromise = (): void => {
  stripePromise = null;
};
