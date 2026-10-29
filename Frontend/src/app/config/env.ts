/**
 * Configuración centralizada de variables de entorno para el frontend.
 * Evita la dispersión de import.meta.env en la base de código.
 */

const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
const rawStripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';
const googleLoginEnabled = import.meta.env.VITE_GOOGLE_LOGIN_ENABLED === 'true' &&
  /^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(googleClientId);

export const env = {
  googleClientId,
  googleLoginEnabled,
  apiBaseUrl:
    typeof rawApiUrl === 'string' && rawApiUrl.trim().length > 0
      ? rawApiUrl.trim().replace(/\/+$/, '')
      : 'http://localhost:4000/api',
  stripePublishableKey:
    typeof rawStripePublishableKey === 'string' && rawStripePublishableKey.trim().length > 0
      ? rawStripePublishableKey.trim()
      : undefined,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;
