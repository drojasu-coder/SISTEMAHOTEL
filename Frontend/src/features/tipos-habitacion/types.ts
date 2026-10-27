/**
 * Modelo de datos de Tipo de Habitación según el backend real.
 * Verificado contra:
 * - backend/src/models/tipohabitacion.js
 * - backend/src/validators/habitaciones/tipoHabitacion.validator.ts
 * - backend/src/controllers/habitaciones/tipoHabitacion.controller.ts
 */

export interface TipoHabitacion {
  id: number;
  nombre: string;
  capacidad_maxima: number;
  tarifa_noche: string | number;
  descripcion: string | null;
  imagen_key?: string | null;
  imagen_url?: string | null;
  imagen_expires_at?: string | number | null;
  imagen_creditos?: {
    autor?: string;
    fuente?: string;
    licencia?: string;
    url?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TiposHabitacionResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: TipoHabitacion[];
}

export interface TipoHabitacionResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: TipoHabitacion;
}

export interface CreateTipoHabitacionInput {
  nombre: string;
  capacidad_maxima: number;
  tarifa_noche: number;
  descripcion?: string | null;
  imagen_key?: string | null;
}

export interface UpdateTipoHabitacionInput {
  nombre?: string;
  capacidad_maxima?: number;
  tarifa_noche?: number;
  descripcion?: string | null;
  imagen_key?: string | null;
}

export interface TiposHabitacionFiltersState {
  search: string;
}
