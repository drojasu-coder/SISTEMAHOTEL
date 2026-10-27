import { api } from "@/api/client/http";
import { uploadEntityImage } from "@/api/mediaUpload";
import type {
  CreateTipoHabitacionInput,
  TipoHabitacion,
  TipoHabitacionResponse,
  TiposHabitacionResponse,
  UpdateTipoHabitacionInput,
} from "../types";

export const tiposHabitacionApi = {
  /**
   * Consulta pública/autenticada de todos los tipos de habitación registrados.
   */
  getAll: async (): Promise<TipoHabitacion[]> => {
    const response = await api.get<TiposHabitacionResponse>("/tipos-habitacion");
    return response.data;
  },

  /**
   * Consulta un tipo de habitación por su identificador numérico.
   */
  getById: async (id: number): Promise<TipoHabitacion> => {
    const response = await api.get<TipoHabitacionResponse>(`/tipos-habitacion/${id}`);
    return response.data;
  },

  /**
   * Registra un nuevo tipo de habitación.
   * Requiere roles de gestión de habitaciones (admin, recepcionista, gerente_habitaciones).
   */
  create: async (data: CreateTipoHabitacionInput): Promise<TipoHabitacion> => {
    const response = await api.post<TipoHabitacionResponse>("/tipos-habitacion", data);
    return response.data;
  },

  /**
   * Actualiza parcialmente un tipo de habitación existente.
   * Requiere roles de gestión de habitaciones.
   */
  update: async (
    id: number,
    data: UpdateTipoHabitacionInput
  ): Promise<TipoHabitacion> => {
    const response = await api.patch<TipoHabitacionResponse>(
      `/tipos-habitacion/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Sube una imagen para el tipo de habitación directamente a S3.
   */
  uploadImage: async (
    id: number,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<TipoHabitacion> => {
    return uploadEntityImage<TipoHabitacion>({
      presignEndpoint: `/tipos-habitacion/${id}/imagen-presign`,
      confirmEndpoint: `/tipos-habitacion/${id}/imagen-confirmar`,
      file,
      onProgress,
    });
  },

  /**
   * Quita la imagen del tipo de habitación.
   */
  removeImage: async (id: number): Promise<TipoHabitacion> => {
    const response = await api.delete<TipoHabitacionResponse>(`/tipos-habitacion/${id}/imagen`);
    return response.data;
  },
};
