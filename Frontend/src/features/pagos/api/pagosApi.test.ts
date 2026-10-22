import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pagosApi } from './pagosApi';
import { api } from '@/api/client/http';
import type {
  CreatePagoInput,
  CreatePagoResponse,
  IntentoActivoPagoResponse,
  Pago,
  PagoResponse,
  ResumenPagoData,
  ResumenPagoResponse,
} from '../types';

describe('pagosApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getResumen', () => {
    const mockResumen: ResumenPagoData = {
      total: 1800,
      anticipo_requerido: 1800,
      aprobado: 0,
      saldo: 1800,
    };

    const mockResponse: ResumenPagoResponse = {
      success: true,
      statusCode: 200,
      message: 'Resumen de pago obtenido correctamente',
      data: mockResumen,
    };

    it('consulta el resumen financiero filtrando por carrito_id', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce(mockResponse);

      const result = await pagosApi.getResumen({ carrito_id: 15 });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith('/pagos/resumen', {
        params: { carrito_id: 15 },
      });
      expect(result).toEqual(mockResumen);
    });

    it('consulta el resumen financiero filtrando por reserva_habitacion_id', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce(mockResponse);

      const result = await pagosApi.getResumen({ reserva_habitacion_id: 8 });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith('/pagos/resumen', {
        params: { reserva_habitacion_id: 8 },
      });
      expect(result).toEqual(mockResumen);
    });
  });

  describe('getIntentoActivo', () => {
    it('obtiene el intento activo y client_secret cuando existe para el carrito', async () => {
      const mockResponse: IntentoActivoPagoResponse = {
        success: true,
        statusCode: 200,
        message: 'Intento de pago activo obtenido',
        data: {
          pago_id: 42,
          payment_intent_id: 'pi_test_active',
          client_secret: 'pi_test_active_secret_foo',
          estado: 'procesando',
          monto: 1800,
          moneda: 'GTQ',
        },
      };

      const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce(mockResponse);

      const result = await pagosApi.getIntentoActivo(15);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith('/pagos/intento-activo', {
        params: { carrito_id: 15 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('retorna null cuando no existe intento activo en proceso para el carrito', async () => {
      const mockResponse: IntentoActivoPagoResponse = {
        success: true,
        statusCode: 200,
        message: 'No hay intento de pago activo',
        data: null,
      };

      vi.spyOn(api, 'get').mockResolvedValueOnce(mockResponse);

      const result = await pagosApi.getIntentoActivo(15);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('envía la solicitud de pago con tarjeta y retorna los identificadores del intento', async () => {
      const input: CreatePagoInput = {
        carrito_id: 15,
        monto: 1800,
        metodo: 'tarjeta',
        tipo_pago: 'total',
        moneda: 'GTQ',
        idempotency_key: 'idemp-test-123',
      };

      const mockResponse: CreatePagoResponse = {
        success: true,
        statusCode: 201,
        message: 'Pago creado correctamente',
        data: {
          pago_id: 99,
          payment_intent_id: 'pi_test_123',
          client_secret: 'pi_test_123_secret_xyz',
          estado: 'procesando',
          monto: 1800,
          moneda: 'GTQ',
        },
      };

      const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce(mockResponse);

      const result = await pagosApi.create(input);

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith('/pagos', input);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getById', () => {
    it('obtiene el detalle del pago por su identificador numérico', async () => {
      const mockPago: Pago = {
        id: 99,
        reserva_habitacion_id: null,
        carrito_id: 15,
        monto: 1800,
        metodo: 'tarjeta',
        estado: 'aprobado',
        id_transaccion_externo: 'pi_test_123',
        moneda: 'GTQ',
        tipo_pago: 'total',
        pasarela: 'stripe',
        idempotency_key: 'idemp-test-123',
        fecha_pago: '2026-10-22T13:00:00.000Z',
        codigo_error_externo: null,
        mensaje_error: null,
        createdAt: '2026-10-22T12:59:00.000Z',
        updatedAt: '2026-10-22T13:00:00.000Z',
      };

      const mockResponse: PagoResponse = {
        success: true,
        statusCode: 200,
        message: 'Pago obtenido correctamente',
        data: mockPago,
      };

      const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce(mockResponse);

      const result = await pagosApi.getById(99);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith('/pagos/99');
      expect(result).toEqual(mockPago);
    });
  });
});
