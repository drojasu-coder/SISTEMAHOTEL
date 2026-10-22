import { api } from '@/api/client/http';
import type {
  CreateMesaInput,
  Mesa,
  MesaResponse,
  MesasResponse,
  UpdateMesaInput,
} from '../types';

/**
 * Cliente de mesas contra la API real.
 * El controlador responde `{ status: 'success', data }`, no el envoltorio
 * `{ success, statusCode, data }` de otros módulos: por eso se desempaqueta `data`.
 */
export const mesasApi = {
  /**
   * Listado de mesas (consulta pública en el backend).
   * El backend no admite filtros ni paginación: devuelve todas las mesas
   * ordenadas por zona e incluye el nombre de la sede.
   */
  getAll: async (): Promise<Mesa[]> => {
    const response = await api.get<MesasResponse>('/mesas');
    return response.data;
  },

  /** Ficha individual por identificador. */
  getById: async (id: number): Promise<Mesa> => {
    const response = await api.get<MesaResponse>(`/mesas/${id}`);
    return response.data;
  },

  /** Alta de mesa (requiere admin o gerente de restaurante). */
  create: async (data: CreateMesaInput): Promise<Mesa> => {
    const response = await api.post<MesaResponse>('/mesas', data);
    return response.data;
  },

  /**
   * Edición parcial de mesa (requiere admin o gerente de restaurante).
   * El PATCH no admite `sucursal_id`: solo zona, capacidad y estado.
   */
  update: async (id: number, data: UpdateMesaInput): Promise<Mesa> => {
    const response = await api.patch<MesaResponse>(`/mesas/${id}`, data);
    return response.data;
  },
};
