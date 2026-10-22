import { api } from '@/api/client/http';
import type {
  CreateSucursalInput,
  Sucursal,
  SucursalResponse,
  SucursalesResponse,
  UpdateSucursalInput,
} from '../types';

export const sedesApi = {
  /**
   * Consulta pública de todas las sedes.
   * El backend las entrega ordenadas alfabéticamente por nombre.
   */
  getAll: async (): Promise<Sucursal[]> => {
    const response = await api.get<SucursalesResponse>('/sucursales');
    return response.data;
  },

  /**
   * Consulta individual por identificador.
   */
  getById: async (id: number): Promise<Sucursal> => {
    const response = await api.get<SucursalResponse>(`/sucursales/${id}`);
    return response.data;
  },

  /**
   * Creación de sede (requiere rol admin).
   */
  create: async (data: CreateSucursalInput): Promise<Sucursal> => {
    const response = await api.post<SucursalResponse>('/sucursales', data);
    return response.data;
  },

  /**
   * Actualización parcial de sede (requiere rol admin).
   */
  update: async (id: number, data: UpdateSucursalInput): Promise<Sucursal> => {
    const response = await api.patch<SucursalResponse>(`/sucursales/${id}`, data);
    return response.data;
  },

  /**
   * Activación o desactivación de la sede mediante PATCH.
   */
  toggleEstado: async (id: number, activa: boolean): Promise<Sucursal> => {
    const response = await api.patch<SucursalResponse>(`/sucursales/${id}`, { activa });
    return response.data;
  },
};
