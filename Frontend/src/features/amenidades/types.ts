/**
 * Modelo de datos de Amenidades según el backend real.
 * Verificado contra:
 * - backend/src/models/amenidad.js
 * - backend/src/models/reservaamenidad.js
 * - backend/src/validators/amenidades/amenidad.validator.ts
 * - backend/src/validators/amenidades/reservaAmenidad.validator.ts
 * - backend/src/controllers/amenidades/amenidad.controller.ts
 * - backend/src/services/amenidades/amenidad.service.ts
 * - backend/src/services/amenidades/reservaAmenidad.service.ts
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

// ============================================================
// CONTRATOS DE RESERVAS DE AMENIDAD (CLIENTES Y CONSULTA)
// ============================================================

export type ReservaAmenidadEstado = "confirmada" | "usada" | "cancelada";

export interface ReservaAmenidad {
  id: number;
  usuario_id: number;
  amenidad_id: number;
  fecha: string; // YYYY-MM-DD
  franja_horaria: string; // HH:MM-HH:MM
  mobiliario: string;
  codigo_qr: string;
  estado: ReservaAmenidadEstado;
  createdAt?: string;
  updatedAt?: string;
  Amenidad?: {
    id: number;
    nombre: string;
    aforo_maximo: number;
    Sucursal?: {
      id?: number;
      nombre: string;
    } | null;
  } | null;
  Usuario?: {
    id: number;
    nombre: string;
    email: string;
  } | null;
}

export interface ReservasAmenidadResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ReservaAmenidad[];
}

export interface ReservaAmenidadResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ReservaAmenidad;
}

export interface CreateReservaAmenidadInput {
  amenidad_id: number;
  fecha: string; // YYYY-MM-DD
  franja_horaria: string; // HH:MM-HH:MM
  mobiliario?: string | null;
}
