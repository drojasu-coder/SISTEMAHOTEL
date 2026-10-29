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
  ComprobanteDisponible,
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

  /**
   * Descarga el comprobante interno PDF de un pago aprobado (no es factura FEL).
   * Endpoint: GET /api/pagos/:id/comprobante
   */
  descargarComprobante: async (id: number): Promise<void> => {
    const blob = await api.get<Blob>(`/pagos/${id}/comprobante`, { responseType: 'blob', headers: { Accept: 'application/pdf' } });
    if (!blob.size || !blob.type.includes('application/pdf')) throw new Error('INVALID_RECEIPT_FILE');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprobante-pago-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  /**
   * Pagos aprobados del cliente que incluyen una reserva, para ofrecer su comprobante.
   * Endpoint: GET /api/pagos/comprobantes
   */
  comprobantesDeReserva: async (tipoItem: string, referenciaId: number, signal?: AbortSignal): Promise<ComprobanteDisponible[]> => {
    const response = await api.get<{ data: ComprobanteDisponible[] }>('/pagos/comprobantes', {
      params: { tipo_item: tipoItem, referencia_id: referenciaId }, signal,
    });
    return response.data;
  },

  /** Verifica un intento ya existente con Stripe desde el servidor. No cobra de nuevo. */
  verify: async (id: number): Promise<Pago> => {
    const response = await api.post<PagoResponse>(`/pagos/${id}/verificar`, {});
    return response.data;
  },
};
