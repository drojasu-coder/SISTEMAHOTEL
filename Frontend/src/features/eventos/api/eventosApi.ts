import { api } from '@/api/client/http';
import type {
  Salon,
  SalonesResponse,
  SalonResponse,
  CreateSalonInput,
  UpdateSalonInput,
  ServicioEvento,
  ServiciosEventoResponse,
  ServicioEventoResponse,
  CreateServicioEventoInput,
  UpdateServicioEventoInput,
  ReservaEvento,
  ReservasEventoResponse,
  ReservaEventoResponse,
  CreateReservaEventoInput,
  UpdateReservaEventoInput,
  UpdateReservaEventoEstadoInput,
  ReservaEventoServicio,
  ReservaEventoServiciosResponse,
  AddReservaEventoServicioInput,
  AddServicioToReservaResponse,
} from '../types';

export const eventosApi = {
  // Salones
  getSalones: async (params?: { sucursal_id?: number }): Promise<Salon[]> => {
    const response = await api.get<SalonesResponse>('/salones', {
      params: params as Record<string, string | number | boolean | undefined | null>,
    });
    return response.data;
  },

  getSalonById: async (id: number): Promise<Salon> => {
    const response = await api.get<SalonResponse>(`/salones/${id}`);
    return response.data;
  },

  createSalon: async (data: CreateSalonInput): Promise<Salon> => {
    const response = await api.post<SalonResponse>('/salones', data);
    return response.data;
  },

  updateSalon: async (id: number, data: UpdateSalonInput): Promise<Salon> => {
    const response = await api.patch<SalonResponse>(`/salones/${id}`, data);
    return response.data;
  },

  deleteSalon: async (id: number): Promise<void> => {
    await api.delete(`/salones/${id}`);
  },

  // Servicios de Evento
  getServiciosEvento: async (): Promise<ServicioEvento[]> => {
    const response = await api.get<ServiciosEventoResponse>('/servicios-evento');
    return response.data;
  },

  getServicioEventoById: async (id: number): Promise<ServicioEvento> => {
    const response = await api.get<ServicioEventoResponse>(`/servicios-evento/${id}`);
    return response.data;
  },

  createServicioEvento: async (data: CreateServicioEventoInput): Promise<ServicioEvento> => {
    const response = await api.post<ServicioEventoResponse>('/servicios-evento', data);
    return response.data;
  },

  updateServicioEvento: async (
    id: number,
    data: UpdateServicioEventoInput
  ): Promise<ServicioEvento> => {
    const response = await api.patch<ServicioEventoResponse>(`/servicios-evento/${id}`, data);
    return response.data;
  },

  deleteServicioEvento: async (id: number): Promise<void> => {
    await api.delete(`/servicios-evento/${id}`);
  },

  // Reservas de Evento
  getReservas: async (params?: Record<string, unknown>): Promise<ReservaEvento[]> => {
    const response = await api.get<ReservasEventoResponse>('/reservas-evento', {
      params: params as Record<string, string | number | boolean | undefined | null>,
    });
    return response.data;
  },

  getReservaById: async (id: number): Promise<ReservaEvento> => {
    const response = await api.get<ReservaEventoResponse>(`/reservas-evento/${id}`);
    return response.data;
  },

  createReserva: async (data: CreateReservaEventoInput): Promise<ReservaEvento> => {
    const response = await api.post<ReservaEventoResponse>('/reservas-evento', data);
    return response.data;
  },

  updateReserva: async (id: number, data: UpdateReservaEventoInput): Promise<ReservaEvento> => {
    const response = await api.patch<ReservaEventoResponse>(`/reservas-evento/${id}`, data);
    return response.data;
  },

  cancelarReserva: async (id: number): Promise<ReservaEvento> => {
    const response = await api.patch<ReservaEventoResponse>(`/reservas-evento/${id}/cancelar`);
    return response.data;
  },

  updateReservaEstado: async (
    id: number,
    data: UpdateReservaEventoEstadoInput
  ): Promise<ReservaEvento> => {
    const response = await api.patch<ReservaEventoResponse>(`/reservas-evento/${id}/estado`, data);
    return response.data;
  },

  // Servicios vinculados a una reserva
  getReservaServicios: async (reservaId: number): Promise<ReservaEventoServicio[]> => {
    const response = await api.get<ReservaEventoServiciosResponse>(
      `/reservas-evento/${reservaId}/servicios`
    );
    return response.data;
  },

  addServicioToReserva: async (
    reservaId: number,
    data: AddReservaEventoServicioInput
  ): Promise<AddServicioToReservaResponse['data']> => {
    const response = await api.post<AddServicioToReservaResponse>(
      `/reservas-evento/${reservaId}/servicios`,
      data
    );
    return response.data;
  },

  removeServicioFromReserva: async (reservaId: number, id: number): Promise<void> => {
    await api.delete(`/reservas-evento/${reservaId}/servicios/${id}`);
  },
};
