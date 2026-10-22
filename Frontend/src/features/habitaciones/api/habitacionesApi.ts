import { api } from "@/api/client/http";
import type {
  CreateHabitacionInput,
  Habitacion,
  HabitacionResponse,
  HabitacionesResponse,
  TipoHabitacion,
  TiposHabitacionResponse,
  UpdateHabitacionInput,
} from "../types";

export const habitacionesApi = {
  /**
   * Consulta todas las habitaciones registradas en el hotel.
   * Requiere autenticación.
   */
  getAll: async (): Promise<Habitacion[]> => {
    const response = await api.get<HabitacionesResponse>("/habitaciones");
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
   * Consulta el catálogo de tipos de habitación (sencilla, doble, suite, etc.).
   * Utilizado para alimentar selectores y asociar nombres y tarifas.
   */
  getTiposHabitacion: async (): Promise<TipoHabitacion[]> => {
    const response = await api.get<TiposHabitacionResponse>("/tipos-habitacion");
    return response.data;
  },
};
