/**
 * Modelo de datos de Amenidades según el backend real.
 * Verificado contra:
 * - backend/src/models/amenidad.js
 * - backend/src/validators/amenidades/amenidad.validator.ts
 * - backend/src/controllers/amenidades/amenidad.controller.ts
 * - backend/src/services/amenidades/amenidad.service.ts
 */

export interface AmenidadSucursal {
  nombre: string;
}

export interface Amenidad {
  id: number;
  sucursal_id: number;
  nombre: string;
  aforo_maximo: number;
  createdAt?: string;
  updatedAt?: string;
  Sucursal?: AmenidadSucursal | null;
}

export interface AmenidadesResponse {
  status: "success";
  data: Amenidad[];
}

export interface AmenidadResponse {
  status: "success";
  data: Amenidad;
}

export interface CreateAmenidadInput {
  sucursal_id: number;
  nombre: string;
  aforo_maximo: number;
}

export interface UpdateAmenidadInput {
  nombre?: string;
  aforo_maximo?: number;
}

export interface AmenidadesFiltersState {
  search: string;
  sucursalId: number | "all";
}
