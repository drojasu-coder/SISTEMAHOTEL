/**
 * Configuración centralizada de variables de entorno para el frontend.
 * Evita la dispersión de import.meta.env en la base de código.
 */

const rawApiUrl = import.meta.env.VITE_API_BASE_URL;

export const env = {
  apiBaseUrl:
    typeof rawApiUrl === 'string' && rawApiUrl.trim().length > 0
      ? rawApiUrl.trim().replace(/\/+$/, '')
      : 'http://localhost:4000/api',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;
