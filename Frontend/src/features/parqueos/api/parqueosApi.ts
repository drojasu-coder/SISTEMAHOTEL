import { api } from "@/api/client/http";
import type {
  CreateParqueoInput,
  Parqueo,
  ParqueoResponse,
  ParqueosResponse,
  UpdateParqueoInput,
} from "../types";

export const parqueosApi = {
  /**
   * Lista los espacios de parqueo registrados.
   * Requiere autenticación (cualquier rol con sesión); el backend no admite
   * filtros ni paginación, por lo que el filtrado se resuelve en el cliente.
   */
  getAll: async (): Promise<Parqueo[]> => {
    const response = await api.get<ParqueosResponse>("/parqueos");
    return response.data;
  },

  /** Consulta un espacio de parqueo por su identificador. */
  getById: async (id: number): Promise<Parqueo> => {
    const response = await api.get<ParqueoResponse>(`/parqueos/${id}`);
    return response.data;
  },

  /**
   * Registra un espacio de parqueo.
   * Requiere rol admin, recepcionista o gerente_habitaciones.
   */
  create: async (data: CreateParqueoInput): Promise<Parqueo> => {
    const response = await api.post<ParqueoResponse>("/parqueos", data);
    return response.data;
  },

  /**
   * Actualiza parcialmente un espacio de parqueo.
   * Requiere rol admin, recepcionista o gerente_habitaciones.
   */
  update: async (id: number, data: UpdateParqueoInput): Promise<Parqueo> => {
    const response = await api.patch<ParqueoResponse>(`/parqueos/${id}`, data);
    return response.data;
  },
};
