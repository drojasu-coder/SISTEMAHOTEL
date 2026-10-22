/**
 * Constantes y tipos para el ciclo de vida y dominio de pagos.
 *
 * Estados de un pago en el backend:
 * - pendiente: creado sin procesar o transferencia en espera de revisión staff
 * - procesando: intento con pasarela (Stripe) en curso
 * - aprobado: confirmado por webhook o liquidado en efectivo
 * - rechazado: declinado por la pasarela o emisor
 * - cancelado: expirado o anulado
 * - reembolsado: devuelto en su totalidad
 * - reembolsado_parcial: devuelto parcialmente
 */
export const ESTADOS_PAGO = [
  'pendiente',
  'procesando',
  'aprobado',
  'rechazado',
  'cancelado',
  'reembolsado',
  'reembolsado_parcial',
] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];

export const METODOS_PAGO = ['tarjeta', 'efectivo', 'transferencia'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export const TIPOS_PAGO = ['total', 'anticipo', 'saldo'] as const;
export type TipoPago = (typeof TIPOS_PAGO)[number];

/**
 * Entidad de pago devuelta por GET /api/pagos/:id y GET /api/pagos.
 */
export interface Pago {
  id: number;
  reserva_habitacion_id: number | null;
  carrito_id: number | null;
  monto: number;
  metodo: MetodoPago;
  estado: EstadoPago;
  id_transaccion_externo: string | null;
  moneda: string;
  tipo_pago: TipoPago;
  pasarela: string | null;
  idempotency_key: string | null;
  fecha_pago: string | null;
  codigo_error_externo: string | null;
  mensaje_error: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Resumen financiero devuelto por GET /api/pagos/resumen.
 * El backend es la única fuente de la verdad para importes y saldos exigibles.
 */
export interface ResumenPagoData {
  total: number;
  anticipo_requerido: number;
  aprobado: number;
  saldo: number;
}

/**
 * Parámetros para iniciar un pago mediante POST /api/pagos.
 */
export interface CreatePagoInput {
  carrito_id?: number;
  reserva_habitacion_id?: number;
  monto: number | string;
  metodo: MetodoPago;
  tipo_pago?: TipoPago;
  moneda?: string;
  idempotency_key?: string;
}

/**
 * Datos devueltos tras la creación exitosa de un intento de pago con tarjeta.
 */
export interface CreatePagoSuccessData {
  pago_id: number;
  payment_intent_id?: string;
  client_secret?: string;
  estado: EstadoPago;
  monto: number;
  moneda: string;
}

/**
 * Envoltorio estándar de respuesta HTTP del backend.
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export type ResumenPagoResponse = ApiResponse<ResumenPagoData>;
export type CreatePagoResponse = ApiResponse<CreatePagoSuccessData>;
export type PagoResponse = ApiResponse<Pago>;
export type PagosResponse = ApiResponse<Pago[]>;
