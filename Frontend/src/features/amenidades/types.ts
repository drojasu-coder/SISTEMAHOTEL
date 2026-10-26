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
  imagen_expires_at?: number | null;
  imagen_creditos?: AssetCreditInfo | null;
};

export type AmenidadesResponse = components["schemas"]["AmenidadesResponse"];
export type AmenidadResponse = components["schemas"]["AmenidadResponse"];
export type CreateAmenidadInput = components["schemas"]["CreateAmenidadRequest"];
export type UpdateAmenidadInput = components["schemas"]["UpdateAmenidadRequest"];

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
