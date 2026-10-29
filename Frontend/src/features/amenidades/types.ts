import type { components } from "@/api/generated/schema";

export interface AssetCreditInfo {
  autor?: string;
  fuente?: string;
  licencia?: string;
  url?: string;
}

export type Amenidad = components["schemas"]["Amenidad"] & {
  imagen_key?: string | null;
  imagen_url?: string | null;
  imagen_expires_at?: string | number | null;
  imagen_creditos?: AssetCreditInfo | null;
  /** false = espacio compartido de libre acceso: el backend rechaza reservas (AMENITY_NOT_RESERVABLE). */
  reservable?: boolean;
  /** Horario de reserva (HH:MM:SS) y duración fija; sin ellos no se ofrecen franjas. */
  hora_apertura?: string | null;
  hora_cierre?: string | null;
  duracion_minutos?: number | null;
};

export type AmenidadesResponse = components["schemas"]["AmenidadesResponse"];
export type AmenidadResponse = components["schemas"]["AmenidadResponse"];
/** Horario de reserva y duración fija, editables desde el panel (null para quitarlos). */
type HorarioAmenidadInput = { hora_apertura?: string | null; hora_cierre?: string | null; duracion_minutos?: number | null };
export type CreateAmenidadInput = components["schemas"]["CreateAmenidadRequest"] & HorarioAmenidadInput;
export type UpdateAmenidadInput = components["schemas"]["UpdateAmenidadRequest"] & HorarioAmenidadInput;

export type ReservaAmenidad = components["schemas"]["ReservaAmenidad"];
export type ReservaAmenidadEstado = ReservaAmenidad["estado"];
export type ReservasAmenidadResponse = components["schemas"]["ReservasAmenidadResponse"];
export type ReservaAmenidadResponse = components["schemas"]["ReservaAmenidadResponse"];
export type CreateReservaAmenidadInput = components["schemas"]["CreateReservaAmenidadRequest"];
export type UpdateReservaAmenidadEstadoInput = components["schemas"]["UpdateReservaAmenidadEstadoRequest"];

export interface AmenidadSucursal {
  id?: number;
  nombre: string;
}

export interface AmenidadesFiltersState {
  search: string;
  sucursalId: number | "all";
}

export interface ReservasAmenidadAdminFiltersState {
  search: string;
  sucursalId: number | "all";
  amenidadId: number | "all";
  fecha: string;
  estado: ReservaAmenidadEstado | "all";
}
