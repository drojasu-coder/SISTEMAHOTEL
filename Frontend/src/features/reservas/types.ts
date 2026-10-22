/**
 * Tipos de transporte y modelos para el dominio de reservas de habitación.
 *
 * Fuente de verdad y contratos verificados contra:
 * - backend/src/models/reservahabitacion.js
 * - backend/src/validators/habitaciones/reservaHabitacion.validator.ts
 * - backend/src/controllers/habitaciones/reservaHabitacion.controller.ts
 * - backend/src/services/habitaciones/reservaHabitacion.service.ts
 * - Especificación funcional del endpoint GET /api/habitaciones/disponibles (BE-012)
 */

export const ESTADOS_RESERVA_HABITACION = [
  'pendiente',
  'confirmada',
  'cancelada',
  'finalizada',
  'expirada',
] as const;

export type EstadoReservaHabitacion = (typeof ESTADOS_RESERVA_HABITACION)[number];

export interface ReservaHabitacionUsuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  telefono?: string | null;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReservaHabitacionTipo {
  id: number;
  nombre: string;
  capacidad_maxima: number;
  tarifa_noche: string | number;
  descripcion?: string | null;
}

export interface ReservaHabitacionSucursal {
  id: number;
  nombre: string;
  activa?: boolean;
}

export interface ReservaHabitacionHabitacion {
  id: number;
  sucursal_id: number;
  tipo_habitacion_id: number;
  numero: string;
  estado: string;
  TipoHabitacion?: ReservaHabitacionTipo;
  Sucursal?: ReservaHabitacionSucursal;
}

/**
 * Modelo representativo de una reserva de habitación en el sistema.
 */
export interface ReservaHabitacion {
  id: number;
  usuario_id: number;
  habitacion_id: number;
  fecha_entrada: string; // Formato AAAA-MM-DD
  fecha_salida: string;  // Formato AAAA-MM-DD
  numero_huespedes: number;
  estado: EstadoReservaHabitacion;
  total: string | number; // Monto calculado con autoridad del servidor (ej. "300.00")
  createdAt: string;
  updatedAt: string;
  Usuario?: ReservaHabitacionUsuario;
  Habitacion?: ReservaHabitacionHabitacion;
}

/**
 * Parámetros para la consulta de disponibilidad de habitaciones (GET /api/habitaciones/disponibles).
 */
export interface DisponibilidadHabitacionQuery {
  sucursal_id: number;
  fecha_entrada: string; // Formato AAAA-MM-DD
  fecha_salida: string;  // Formato AAAA-MM-DD
  numero_huespedes: number;
  tipo_habitacion_id?: number;
}

/**
 * Estructura de habitación devuelta por la consulta de disponibilidad por fechas.
 */
export interface HabitacionDisponible {
  id: number;
  numero: string;
  estado: string;
  sucursal_id: number;
  tipo_habitacion_id: number;
  noches: number;
  tarifa_noche: string | number;
  total_estimado: string | number;
  Sucursal?: ReservaHabitacionSucursal;
  TipoHabitacion?: ReservaHabitacionTipo;
}

/**
 * Payload para que un cliente cree su reserva (POST /api/reservas-habitacion).
 * El cliente NUNCA envía usuario_id (se obtiene del JWT), ni estado, ni total, ni tarifa.
 */
export interface CreateReservaHabitacionInput {
  habitacion_id: number;
  fecha_entrada: string; // Formato AAAA-MM-DD
  fecha_salida: string;  // Formato AAAA-MM-DD
  numero_huespedes: number;
}

// Envoltorios de respuesta de la API REST
export interface ReservaHabitacionResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ReservaHabitacion;
}

export interface ReservasHabitacionResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ReservaHabitacion[];
}

export interface DisponibilidadHabitacionesResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: HabitacionDisponible[];
}
