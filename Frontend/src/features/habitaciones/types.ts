/**
 * Tipos para el módulo de gestión de habitaciones.
 * Verificado contra:
 * - backend/src/models/habitacion.js
 * - backend/src/validators/habitaciones/habitacion.validator.ts
 * - backend/src/controllers/habitaciones/habitacion.controller.ts
 */

export const ESTADOS_HABITACION = [
  "disponible",
  "ocupada",
  "mantenimiento",
  "limpieza",
] as const;

export type EstadoHabitacion = (typeof ESTADOS_HABITACION)[number];

export interface Habitacion {
  id: number;
  sucursal_id: number;
  tipo_habitacion_id: number;
  numero: string;
  estado: EstadoHabitacion;
  createdAt?: string;
  updatedAt?: string;
  Sucursal?: {
    id: number;
    nombre: string;
    activa?: boolean;
  };
  TipoHabitacion?: {
    id: number;
    nombre: string;
    capacidad_maxima?: number;
    tarifa_noche?: string | number;
  };
}

export interface TipoHabitacion {
  id: number;
  nombre: string;
  capacidad_maxima: number;
  tarifa_noche: string | number;
  descripcion: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface HabitacionesResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Habitacion[];
}

export interface HabitacionResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Habitacion;
}

export interface TiposHabitacionResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: TipoHabitacion[];
}

export interface CreateHabitacionInput {
  sucursal_id: number;
  tipo_habitacion_id: number;
  numero: string;
  estado?: EstadoHabitacion;
}

export interface UpdateHabitacionInput {
  sucursal_id?: number;
  tipo_habitacion_id?: number;
  numero?: string;
  estado?: EstadoHabitacion;
}

export interface HabitacionesFiltersState {
  search: string;
  sucursalId: number | "all";
  estado: EstadoHabitacion | "all";
}
