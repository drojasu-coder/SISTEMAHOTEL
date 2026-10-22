/**
 * Tipos para el módulo de gestión de espacios de parqueo.
 * Verificado contra:
 * - backend/src/models/parqueo.js
 * - backend/src/validators/habitaciones/parqueo.validator.ts
 * - backend/src/controllers/habitaciones/parqueo.controller.ts
 * - backend/src/services/habitaciones/parqueo.service.ts
 */

/**
 * Estados admitidos por el backend. El listado del validador es la única fuente:
 * no se agregan ni se derivan estados nuevos.
 */
export const ESTADOS_PARQUEO = ["disponible", "ocupado", "mantenimiento"] as const;

export type EstadoParqueo = (typeof ESTADOS_PARQUEO)[number];

export interface Parqueo {
  id: number;
  sucursal_id: number;
  /** Identificador del espacio dentro de la sede (máx. 10 caracteres). */
  numero: string;
  /**
   * Estado físico actual del espacio. NO representa disponibilidad para reservar
   * en una fecha concreta: el backend solo bloquea reservas cuando el estado es
   * "mantenimiento" (ver reservaParqueo.service.ts).
   */
  estado: EstadoParqueo;
  createdAt?: string;
  updatedAt?: string;
  /**
   * El listado del backend no incluye la asociación de sede, por lo que se
   * resuelve con el catálogo real de sedes (GET /api/sucursales).
   */
  Sucursal?: {
    id: number;
    nombre: string;
  } | null;
}

/** Envoltorio de éxito que usa el controlador de parqueos. */
export interface ParqueosResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Parqueo[];
}

export interface ParqueoResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Parqueo;
}

export interface CreateParqueoInput {
  sucursal_id: number;
  numero: string;
  estado?: EstadoParqueo;
}

/**
 * El PATCH acepta los mismos campos, todos opcionales. A diferencia de otros
 * recursos, aquí sí se puede reasignar la sede.
 */
export interface UpdateParqueoInput {
  sucursal_id?: number;
  numero?: string;
  estado?: EstadoParqueo;
}

export interface ParqueosFiltersState {
  search: string;
  sucursalId: number | "all";
  estado: EstadoParqueo | "all";
}
