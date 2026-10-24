import type { components } from "@/api/generated/schema";

export type Amenidad = components["schemas"]["Amenidad"];
export type AmenidadesResponse = components["schemas"]["AmenidadesResponse"];
export type AmenidadResponse = components["schemas"]["AmenidadResponse"];
export type CreateAmenidadInput = components["schemas"]["CreateAmenidadRequest"];
export type UpdateAmenidadInput = components["schemas"]["UpdateAmenidadRequest"];

export type ReservaAmenidad = components["schemas"]["ReservaAmenidad"];
export type ReservaAmenidadEstado = ReservaAmenidad["estado"];
export type ReservasAmenidadResponse = components["schemas"]["ReservasAmenidadResponse"];
export type ReservaAmenidadResponse = components["schemas"]["ReservaAmenidadResponse"];
export type CreateReservaAmenidadInput = components["schemas"]["CreateReservaAmenidadRequest"];

export interface AmenidadSucursal {
  id?: number;
  nombre: string;
}

export interface AmenidadesFiltersState {
  search: string;
  sucursalId: number | "all";
}
