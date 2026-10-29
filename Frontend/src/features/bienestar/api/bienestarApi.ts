import { api } from '@/api/client/http';

export interface DisponibilidadBienestar {
  fecha: string;
  duracion_minutos: number;
  descanso_minutos: number;
  intervalo_minutos: number;
  /** Horario de atención del servicio; null si aún no está configurado. */
  horario: { apertura: string; cierre: string } | null;
  /** Inicios disponibles (HH:MM) por terapeuta, ya sin citas ocupadas ni descansos. */
  terapeutas: { id: number; nombre: string; horarios: string[] }[];
}
import { uploadEntityImage } from '@/api/mediaUpload';
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

  getDisponibilidad: async (servicioId: number, fecha: string): Promise<DisponibilidadBienestar> => {
    const response = await api.get<{ data: DisponibilidadBienestar }>(`/servicios-spa/${servicioId}/disponibilidad?fecha=${encodeURIComponent(fecha)}`);
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

  uploadServicioImage: async (
    id: number,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<ServicioBienestar> => {
    return uploadEntityImage<ServicioBienestar>({
      presignEndpoint: `/servicios-spa/${id}/imagen-presign`,
      confirmEndpoint: `/servicios-spa/${id}/imagen-confirmar`,
      file,
      onProgress,
    });
  },

  removeServicioImage: async (id: number): Promise<ServicioBienestar> => {
    const response = await api.delete<ServicioBienestarResponse>(`/servicios-spa/${id}/imagen`);
    return response.data;
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
    const response = await api.patch<TerapeutaResponse>(
      `/terapeutas/${id}`,
      data
    );
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
