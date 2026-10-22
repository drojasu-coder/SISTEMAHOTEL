import { api } from "@/api/client/http";
import type {
  Amenidad,
  AmenidadResponse,
  AmenidadesResponse,
  CreateAmenidadInput,
  UpdateAmenidadInput,
} from "../types";

export const amenidadesApi = {
  /**
   * Consulta pública de todas las amenidades registradas.
   * El backend las entrega ordenadas alfabéticamente e incluye el nombre de la sucursal.
   */
  getAll: async (): Promise<Amenidad[]> => {
    const response = await api.get<AmenidadesResponse>("/amenidades");
    return response.data;
  },

  /**
   * Consulta individual de una amenidad por su identificador.
   */
  getById: async (id: number): Promise<Amenidad> => {
    const response = await api.get<AmenidadResponse>(`/amenidades/${id}`);
    return response.data;
  },

  /**
   * Creación de una nueva amenidad.
   * Requiere rol admin (permiso servicios.administrar).
   */
  create: async (data: CreateAmenidadInput): Promise<Amenidad> => {
    const response = await api.post<AmenidadResponse>("/amenidades", data);
    return response.data;
  },

  /**
   * Actualización parcial de una amenidad (nombre y/o aforo máximo).
   * Requiere rol admin (permiso servicios.administrar).
   */
  update: async (
    id: number,
    data: UpdateAmenidadInput
  ): Promise<Amenidad> => {
    const response = await api.patch<AmenidadResponse>(`/amenidades/${id}`, data);
    return response.data;
  },
};
