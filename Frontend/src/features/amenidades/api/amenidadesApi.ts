import { api } from "@/api/client/http";
import type {
  Amenidad,
  AmenidadResponse,
  AmenidadesResponse,
  CreateAmenidadInput,
  UpdateAmenidadInput,
  ReservaAmenidad,
  ReservaAmenidadResponse,
  ReservasAmenidadResponse,
  CreateReservaAmenidadInput,
  UpdateReservaAmenidadEstadoInput,
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

export const reservasAmenidadApi = {
  getMine: async (): Promise<ReservaAmenidad[]> => {
    const response = await api.get<ReservasAmenidadResponse>(
      "/reservas-amenidad/mis-reservas"
    );
    return response.data;
  },

  getMineById: async (id: number): Promise<ReservaAmenidad> => {
    const response = await api.get<ReservaAmenidadResponse>(
      `/reservas-amenidad/mis-reservas/${id}`
    );
    return response.data;
  },

  /**
   * Creación de reserva de amenidad para el cliente autenticado.
   * POST /api/reservas-amenidad
   */
  create: async (data: CreateReservaAmenidadInput): Promise<ReservaAmenidad> => {
    const response = await api.post<ReservaAmenidadResponse>("/reservas-amenidad", data);
    return response.data;
  },

  /**
   * Listado administrativo de todas las reservas de amenidad.
   * GET /api/reservas-amenidad
   */
  getAll: async (): Promise<ReservaAmenidad[]> => {
    const response = await api.get<ReservasAmenidadResponse>("/reservas-amenidad");
    return response.data;
  },

  /**
   * Detalle administrativo de reserva de amenidad por identificador.
   * GET /api/reservas-amenidad/:id
   */
  getById: async (id: number): Promise<ReservaAmenidad> => {
    const response = await api.get<ReservaAmenidadResponse>(`/reservas-amenidad/${id}`);
    return response.data;
  },

  /**
   * Actualización del estado de una reserva de amenidad (cancelada o usada).
   * PATCH /api/reservas-amenidad/:id/estado
   */
  updateEstado: async (
    id: number,
    data: UpdateReservaAmenidadEstadoInput
  ): Promise<ReservaAmenidad> => {
    const response = await api.patch<ReservaAmenidadResponse>(
      `/reservas-amenidad/${id}/estado`,
      data
    );
    return response.data;
  },
};
