import { jsonResponse } from '@/test/renderWithProviders';
import type {
  CreatePagoSuccessData,
  IntentoActivoData,
  Pago,
  ResumenPagoData,
} from './types';

export function respuestaResumen(
  data: Partial<ResumenPagoData> = {},
): Response {
  return jsonResponse({
    success: true,
    statusCode: 200,
    message: 'Resumen obtenido correctamente',
    data: {
      total: 600,
      anticipo_requerido: 0,
      aprobado: 0,
      saldo: 600,
      ...data,
    },
  });
}

export function respuestaIntento(
  data: IntentoActivoData | null,
): Response {
  return jsonResponse({
    success: true,
    statusCode: 200,
    message: data
      ? 'Intento activo obtenido correctamente'
      : 'No hay un intento activo',
    data,
  });
}

export function crearIntentoActivo(
  overrides: Partial<IntentoActivoData> = {},
): IntentoActivoData {
  return {
    pago_id: 88,
    payment_intent_id: 'pi_qa_123',
    client_secret: 'pi_qa_123_secret_abc',
    estado_local: 'procesando',
    estado_pasarela: 'requires_confirmation',
    estado_intento: 'requiere_confirmacion',
    monto: 600,
    moneda: 'GTQ',
    puede_confirmar: true,
    ...overrides,
  };
}

export function respuestaCrearPago(
  data: Partial<CreatePagoSuccessData> = {},
): Response {
  return jsonResponse(
    {
      success: true,
      statusCode: 201,
      message: 'Intento de pago creado',
      data: {
        pago_id: 88,
        payment_intent_id: 'pi_qa_123',
        client_secret: 'pi_qa_123_secret_abc',
        estado: 'procesando',
        monto: 600,
        moneda: 'GTQ',
        ...data,
      },
    },
    201,
  );
}

export function crearPago(overrides: Partial<Pago> = {}): Pago {
  return {
    id: 88,
    reserva_habitacion_id: null,
    carrito_id: 10,
    monto: 600,
    metodo: 'tarjeta',
    estado: 'procesando',
    id_transaccion_externo: 'pi_qa_123',
    moneda: 'GTQ',
    tipo_pago: 'total',
    pasarela: 'stripe',
    idempotency_key: null,
    fecha_pago: null,
    codigo_error_externo: null,
    mensaje_error: null,
    createdAt: '2026-10-22T17:00:00.000Z',
    updatedAt: '2026-10-22T17:00:00.000Z',
    ...overrides,
  };
}

export function respuestaPago(data: Partial<Pago> = {}): Response {
  return jsonResponse({
    success: true,
    statusCode: 200,
    message: 'Pago obtenido correctamente',
    data: crearPago(data),
  });
}
