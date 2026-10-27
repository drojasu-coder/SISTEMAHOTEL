import { api } from '@/api/client/http';
import type {
  CreatePagoInput,
  CreatePagoResponse,
  CreatePagoSuccessData,
  IntentoActivoData,
  IntentoActivoPagoResponse,
  Pago,
  PagoResponse,
  ResumenPagoData,
  ResumenPagoResponse,
} from '../types';

/**
 * Cliente HTTP tipado para el dominio de pagos y checkout.
 */
export const pagosApi = {
  /**
   * Obtiene el resumen financiero calculado por el servidor para un carrito o reserva.
   * Endpoint: GET /api/pagos/resumen
   */
  getResumen: async (params: {
    carrito_id?: number;
    reserva_habitacion_id?: number;
  }): Promise<ResumenPagoData> => {
    const response = await api.get<ResumenPagoResponse>('/pagos/resumen', {
      params: {
        ...(params.carrito_id !== undefined ? { carrito_id: params.carrito_id } : {}),
        ...(params.reserva_habitacion_id !== undefined
          ? { reserva_habitacion_id: params.reserva_habitacion_id }
          : {}),
      },
    });
    return response.data;
  },

  /**
   * Recupera de forma autorizada y de solo lectura un intento de pago activo con tarjeta para el carrito.
   * Devuelve los datos discriminados del intento (requiere_confirmacion, procesando, completado_en_pasarela, cancelado)
   * o null si no existe ningún intento registrado para el carrito.
   * Lanza ApiError si ocurre un error de comunicación con Stripe (502/503), evitando confundir fallos con ausencia de intento.
   * Endpoint: GET /api/pagos/intento-activo?carrito_id=:id
   */
  getIntentoActivo: async (carritoId: number): Promise<IntentoActivoData | null> => {
    const response = await api.get<IntentoActivoPagoResponse>('/pagos/intento-activo', {
      params: { carrito_id: carritoId },
    });
    return response.data;
  },

  /**
   * Inicia o reproduce (replay idempotente) un intento de pago contra el backend.
   * Para método tarjeta, devuelve los identificadores y client_secret de Stripe.
   * Endpoint: POST /api/pagos
   */
  create: async (data: CreatePagoInput): Promise<CreatePagoSuccessData> => {
    const response = await api.post<CreatePagoResponse>('/pagos', data);
    return response.data;
  },

  /**
   * Consulta el estado actual de un pago por su identificador.
   * Endpoint: GET /api/pagos/:id
   */
  getById: async (id: number): Promise<Pago> => {
    const response = await api.get<PagoResponse>(`/pagos/${id}`);
    return response.data;
  },
};
