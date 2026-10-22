import { api } from '@/api/client/http';
import type {
  CreatePagoInput,
  CreatePagoResponse,
  CreatePagoSuccessData,
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
   * Recupera de forma autorizada un intento de pago activo con tarjeta ('procesando') para el carrito.
   * Devuelve los datos necesarios (incluyendo client_secret fresco consultado de Stripe) o null si no hay intento activo.
   * Endpoint: GET /api/pagos/intento-activo?carrito_id=:id
   */
  getIntentoActivo: async (carritoId: number): Promise<CreatePagoSuccessData | null> => {
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
