import { api } from "@/api/client/http";
import { uploadEntityImage } from "@/api/mediaUpload";
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

export interface DisponibilidadAmenidad {
  fecha: string;
  aforo_maximo: number;
  /** Duración fija de cada reserva; null si la amenidad aún no la tiene configurada. */
  duracion_minutos: number | null;
  intervalo_minutos: number;
  /** Horario de reserva; null si aún no está configurado (no se ofrecen franjas). */
  horario: { apertura: string; cierre: string } | null;
  /** Franjas del día con las plazas libres que quedan según el aforo. */
  horarios: { inicio: string; fin: string; disponibles: number }[];
}

export const amenidadesApi = {
  /** Franjas calculadas por el servidor; la reserva se valida de nuevo al confirmar. */
  getDisponibilidad: async (id: number, fecha: string): Promise<DisponibilidadAmenidad> => {
    const response = await api.get<{ data: DisponibilidadAmenidad }>(`/amenidades/${id}/disponibilidad?fecha=${encodeURIComponent(fecha)}`);
    return response.data;
  },

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

  /**
   * Sube una imagen para la amenidad directamente a S3.
   */
  uploadImage: async (
    id: number,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<Amenidad> => {
    return uploadEntityImage<Amenidad>({
      presignEndpoint: `/amenidades/${id}/imagen-presign`,
      confirmEndpoint: `/amenidades/${id}/imagen-confirmar`,
      file,
      onProgress,
    });
  },

  /**
   * Quita la imagen de la amenidad.
   */
  removeImage: async (id: number): Promise<Amenidad> => {
    const response = await api.delete<AmenidadResponse>(`/amenidades/${id}/imagen`);
    return response.data;
  },
};

export const reservasAmenidadApi = {
  /**
   * Creación de reserva de amenidad para el cliente autenticado.
   * POST /api/reservas-amenidad
   */
  create: async (data: CreateReservaAmenidadInput): Promise<ReservaAmenidad> => {
    const response = await api.post<ReservaAmenidadResponse>("/reservas-amenidad", data);
    return response.data;
  },

  /**
   * Listado de reservas de amenidad (propias para clientes, todas para admin).
   * GET /api/reservas-amenidad
   */
  getAll: async (): Promise<ReservaAmenidad[]> => {
    const response = await api.get<ReservasAmenidadResponse>("/reservas-amenidad");
    return response.data;
  },

  /**
   * Detalle individual de reserva de amenidad por identificador.
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
