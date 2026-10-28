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
  imagen_key?: string | null;
  imagen_url?: string | null;
  imagen_expires_at?: string | null;
  imagen_creditos?: {
    autor?: string;
    fuente?: string;
    licencia?: string;
    url?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  Sucursal?: {
    id: number;
    nombre: string;
    activa?: boolean;
    direccion?: string;
    ciudad?: string;
  };
  sucursal?: {
    id: number;
    nombre: string;
    activa?: boolean;
    direccion?: string;
    ciudad?: string;
  };
  TipoHabitacion?: {
    id: number;
    nombre: string;
    capacidad_maxima?: number;
    tarifa_noche?: string | number;
    descripcion?: string | null;
    imagen_url?: string | null;
  };
  tipo_habitacion?: {
    id: number;
    nombre: string;
    capacidad_maxima?: number;
    tarifa_noche?: string | number;
    descripcion?: string | null;
    imagen_url?: string | null;
  };
}

export interface TipoHabitacion {
  id: number;
  nombre: string;
  capacidad_maxima: number;
  tarifa_noche: string | number;
  descripcion: string | null;
  /** Sede de la categoría; null en tipos generales anteriores (sin inventario comercial). */
  sucursal_id?: number | null;
  /** Nombre visible ("Deluxe King"); en el contrato público ya viene en "nombre". */
  nombre_comercial?: string | null;
  sucursal?: { id: number; nombre: string } | null;
  /** Unidad real de la categoría, para enlazar el detalle público. */
  habitacion_referencia_id?: number;
  imagen_key?: string | null;
  imagen_url?: string | null;
  imagen_expires_at?: string | null;
  imagen_creditos?: {
    autor?: string;
    fuente?: string;
    licencia?: string;
    url?: string;
  } | null;
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
  imagen_key?: string | null;
}

export interface UpdateHabitacionInput {
  sucursal_id?: number;
  tipo_habitacion_id?: number;
  numero?: string;
  estado?: EstadoHabitacion;
  imagen_key?: string | null;
}

export interface HabitacionesFiltersState {
  search: string;
  sucursalId: number | "all";
  estado: EstadoHabitacion | "all";
}

/**
 * Representación pública de una habitación para catálogo y detalle.
 * No expone campos internos ni operativos (numero, estado, claves de imagen).
 */
export interface HabitacionPublico {
  id: number;
  tipo: {
    id: number;
    nombre: string;
    sucursal_id?: number | null;
    descripcion: string | null;
    capacidad_maxima: number;
    tarifa_noche: string;
    imagen_url: string | null;
    imagen_creditos: {
      autor?: string;
      fuente?: string;
      licencia?: string;
      url?: string;
    } | null;
  } | null;
  sucursal: {
    id: number;
    nombre: string;
  } | null;
  imagen_url: string | null;
  imagen_creditos: {
    autor?: string;
    fuente?: string;
    licencia?: string;
    url?: string;
  } | null;
}

/**
 * Representación pública de una habitación disponible (con tarifas calculadas).
 */
export interface HabitacionDisponiblePublico extends HabitacionPublico {
  noches: number;
  tarifa_noche: string;
  total_estimado: string;
}
