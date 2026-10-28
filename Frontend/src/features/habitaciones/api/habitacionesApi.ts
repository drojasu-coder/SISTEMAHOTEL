import { api } from "@/api/client/http";
import { uploadEntityImage } from "@/api/mediaUpload";
import type { DisponibilidadHabitacionQuery } from "@/features/reservas/types";
import type {
  CreateHabitacionInput,
  Habitacion,
  HabitacionDisponiblePublico,
  HabitacionPublico,
  HabitacionResponse,
  HabitacionesResponse,
  TipoHabitacion,
  TiposHabitacionResponse,
  UpdateHabitacionInput,
} from "../types";

interface PublicEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export const habitacionesApi = {
  /**
   * Consulta todas las habitaciones registradas en el hotel.
   * Requiere autenticación.
   */
  getAll: async (sucursalId?: number): Promise<Habitacion[]> => {
    // La sede se filtra en el servidor, dentro del alcance autorizado del usuario.
    const response = await api.get<HabitacionesResponse>("/habitaciones", {
      params: { sucursal_id: sucursalId },
    });
    return response.data;
  },

  /**
   * Consulta una habitación específica por su identificador.
   */
  getById: async (id: number): Promise<Habitacion> => {
    const response = await api.get<HabitacionResponse>(`/habitaciones/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva habitación.
   * Requiere rol con permiso habitaciones.gestionar (admin, recepcionista, gerente_habitaciones).
   */
  create: async (data: CreateHabitacionInput): Promise<Habitacion> => {
    const response = await api.post<HabitacionResponse>("/habitaciones", data);
    return response.data;
  },

  /**
   * Actualiza parcialmente los datos de una habitación.
   * Requiere rol con permiso habitaciones.gestionar.
   */
  update: async (id: number, data: UpdateHabitacionInput): Promise<Habitacion> => {
    const response = await api.patch<HabitacionResponse>(`/habitaciones/${id}`, data);
    return response.data;
  },

  /**
   * Sube una imagen para la habitación directamente a S3 con validación.
   */
  uploadImage: async (
    id: number,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<Habitacion> => {
    return uploadEntityImage<Habitacion>({
      presignEndpoint: `/habitaciones/${id}/imagen-presign`,
      confirmEndpoint: `/habitaciones/${id}/imagen-confirmar`,
      file,
      onProgress,
    });
  },

  /**
   * Quita la imagen de la habitación.
   */
  removeImage: async (id: number): Promise<Habitacion> => {
    const response = await api.delete<HabitacionResponse>(`/habitaciones/${id}/imagen`);
    return response.data;
  },

  /**
   * Consulta el catálogo público de habitaciones (sin autenticación).
   * Endpoint: GET /public/habitaciones (el base URL ya incluye /api)
   */
  getPublic: async (): Promise<HabitacionPublico[]> => {
    const response = await api.get<PublicEnvelope<HabitacionPublico[]>>(
      "/public/habitaciones",
      { token: null }
    );
    return response.data;
  },

  /**
   * Consulta una habitación pública por su identificador (sin autenticación).
   * Endpoint: GET /public/habitaciones/:id
   */
  getPublicById: async (id: number): Promise<HabitacionPublico> => {
    const response = await api.get<PublicEnvelope<HabitacionPublico>>(
      `/public/habitaciones/${id}`,
      { token: null }
    );
    return response.data;
  },

  /**
   * Consulta habitaciones disponibles públicas por fechas y sede (sin autenticación).
   * Endpoint: GET /public/habitaciones/disponibles
   */
  getPublicDisponibles: async (
    query: DisponibilidadHabitacionQuery
  ): Promise<HabitacionDisponiblePublico[]> => {
    const params: Record<string, string | number> = {
      sucursal_id: query.sucursal_id,
      fecha_entrada: query.fecha_entrada,
      fecha_salida: query.fecha_salida,
      numero_huespedes: query.numero_huespedes,
    };

    if (query.tipo_habitacion_id !== undefined) {
      params.tipo_habitacion_id = query.tipo_habitacion_id;
    }

    const response = await api.get<PublicEnvelope<HabitacionDisponiblePublico[]>>(
      "/public/habitaciones/disponibles",
      { params, token: null }
    );
    return response.data;
  },

  /**
   * Consulta el catálogo de tipos de habitación (sencilla, doble, suite, etc.).
   * Utilizado para alimentar selectores y asociar nombres y tarifas.
   * Requiere autenticación (endpoint privado).
   */
  getTiposHabitacion: async (): Promise<TipoHabitacion[]> => {
    const response = await api.get<TiposHabitacionResponse>("/tipos-habitacion");
    return response.data;
  },

  /**
   * Consulta los tipos de habitación públicos (sin autenticación).
   * Endpoint: GET /public/tipos-habitacion
   */
  getPublicTiposHabitacion: async (): Promise<TipoHabitacion[]> => {
    const response = await api.get<PublicEnvelope<TipoHabitacion[]>>(
      "/public/tipos-habitacion",
      { token: null }
    );
    return response.data;
  },
};
