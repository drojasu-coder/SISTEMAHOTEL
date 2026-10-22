import { ApiError } from '@/api/client/http';
import { es } from '@/i18n/es';

/**
 * Traduce un error a un mensaje apto para el usuario final.
 * Los errores 4xx del backend son controlados y están en español; los 5xx y
 * los fallos de red se sustituyen por mensajes genéricos.
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return es.errores.sinConexion;
    if (error.status >= 500) return es.errores.servidor;
    if (error.status === 429) return es.errores.demasiadosIntentos;
    return error.message;
  }
  if (error instanceof Error && error.name === 'AuthFlowError') return error.message;
  return es.errores.inesperado;
}

/** Errores de validación por campo devueltos por el backend (400 VALIDATION_ERROR). */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  return Object.fromEntries(error.details.map((item) => [item.field, item.message]));
}
