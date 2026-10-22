import { api } from "@/api/client/http";
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
};
