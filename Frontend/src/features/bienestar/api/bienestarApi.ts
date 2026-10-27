import { api } from '@/api/client/http';
import type {
  ServicioBienestar,
  ServiciosBienestarResponse,
  ServicioBienestarResponse,
  CreateServicioBienestarInput,
  UpdateServicioBienestarInput,
  Terapeuta,
  TerapeutasResponse,
  TerapeutaResponse,
  CreateTerapeutaInput,
  UpdateTerapeutaInput,
  CitaBienestar,
  CitasBienestarResponse,
  CitaBienestarResponse,
  CreateCitaBienestarInput,
  UpdateCitaBienestarEstadoInput,
} from '../types';

export const bienestarApi = {
  // Servicios de Bienestar
  getServicios: async (): Promise<ServicioBienestar[]> => {
    const response = await api.get<ServiciosBienestarResponse>('/servicios-spa');
    return response.data;
  },

  getServicioById: async (id: number): Promise<ServicioBienestar> => {
    const response = await api.get<ServicioBienestarResponse>(`/servicios-spa/${id}`);
    return response.data;
  },

  createServicio: async (data: CreateServicioBienestarInput): Promise<ServicioBienestar> => {
    const response = await api.post<ServicioBienestarResponse>('/servicios-spa', data);
    return response.data;
  },

  updateServicio: async (
    id: number,
    data: UpdateServicioBienestarInput
  ): Promise<ServicioBienestar> => {
    const response = await api.patch<ServicioBienestarResponse>(`/servicios-spa/${id}`, data);
    return response.data;
  },

  deleteServicio: async (id: number): Promise<void> => {
    await api.delete(`/servicios-spa/${id}`);
  },

  // Terapeutas
  getTerapeutas: async (): Promise<Terapeuta[]> => {
    const response = await api.get<TerapeutasResponse>('/terapeutas');
    return response.data;
  },

  getTerapeutaById: async (id: number): Promise<Terapeuta> => {
    const response = await api.get<TerapeutaResponse>(`/terapeutas/${id}`);
    return response.data;
  },

  createTerapeuta: async (data: CreateTerapeutaInput): Promise<Terapeuta> => {
    const response = await api.post<TerapeutaResponse>('/terapeutas', data);
    return response.data;
  },

  updateTerapeuta: async (
    id: number,
    data: UpdateTerapeutaInput
  ): Promise<Terapeuta> => {
    const response = await api.patch<TerapeutaResponse>(`/terapeutas/${id}`, data);
    return response.data;
  },

  deleteTerapeuta: async (id: number): Promise<void> => {
    await api.delete(`/terapeutas/${id}`);
  },

  // Citas de Bienestar - Cliente
  createCita: async (data: CreateCitaBienestarInput): Promise<CitaBienestar> => {
    const response = await api.post<CitaBienestarResponse>('/citas-spa', data);
    return response.data;
  },

  getMisCitas: async (): Promise<CitaBienestar[]> => {
    const response = await api.get<CitasBienestarResponse>('/citas-spa/mis-reservas');
    return response.data;
  },

  getMiCitaById: async (id: number): Promise<CitaBienestar> => {
    const response = await api.get<CitaBienestarResponse>(`/citas-spa/mis-reservas/${id}`);
    return response.data;
  },

  // Citas de Bienestar - Administración
  getAdminCitas: async (): Promise<CitaBienestar[]> => {
    const response = await api.get<CitasBienestarResponse>('/citas-spa');
    return response.data;
  },

  getAdminCitaById: async (id: number): Promise<CitaBienestar> => {
    const response = await api.get<CitaBienestarResponse>(`/citas-spa/${id}`);
    return response.data;
  },

  updateAdminCitaEstado: async (
    id: number,
    data: UpdateCitaBienestarEstadoInput
  ): Promise<CitaBienestar> => {
    const response = await api.patch<CitaBienestarResponse>(`/citas-spa/${id}/estado`, data);
    return response.data;
  },
};
