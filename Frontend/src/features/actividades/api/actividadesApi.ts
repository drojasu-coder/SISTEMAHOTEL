import { api } from '@/api/client/http';
import type {
  RecursoActividad,
  RecursosActividadResponse,
  RecursoActividadResponse,
  Instructor,
  InstructoresResponse,
  ReservaActividad,
  ReservasActividadResponse,
  ReservaActividadResponse,
  CreateReservaActividadInput,
  UpdateReservaActividadInput,
} from '../types';

export const actividadesApi = {
  /**
   * Consulta pública de instalaciones y recursos deportivos y recreativos.
   * GET /api/recursos-actividad
   */
  getRecursos: async (): Promise<RecursoActividad[]> => {
    const response = await api.get<RecursosActividadResponse>('/recursos-actividad');
    return response.data;
  },

  /**
   * Consulta individual de un recurso o instalación por ID.
   * GET /api/recursos-actividad/:id
   */
  getRecursoById: async (id: number): Promise<RecursoActividad> => {
    const response = await api.get<RecursoActividadResponse>(`/recursos-actividad/${id}`);
    return response.data;
  },

  /**
   * Consulta pública de instructores deportivos del hotel.
   * GET /api/instructores
   */
  getInstructores: async (): Promise<Instructor[]> => {
    const response = await api.get<InstructoresResponse>('/instructores');
    return response.data;
  },

  /**
   * Creación de reserva de actividad para el cliente autenticado.
   * POST /api/reservas-actividad
   */
  createReserva: async (data: CreateReservaActividadInput): Promise<ReservaActividad> => {
    const response = await api.post<ReservaActividadResponse>('/reservas-actividad', data);
    return response.data;
  },

  /**
   * Listado de reservas de actividades exclusivas del cliente autenticado.
   * GET /api/reservas-actividad/mis-reservas
   */
  getMyReservas: async (): Promise<ReservaActividad[]> => {
    const response = await api.get<ReservasActividadResponse>('/reservas-actividad/mis-reservas');
    return response.data;
  },

  /**
   * Detalle individual de reserva de actividad del cliente autenticado.
   * GET /api/reservas-actividad/mis-reservas/:id
   */
  getMyReservaById: async (id: number): Promise<ReservaActividad> => {
    const response = await api.get<ReservaActividadResponse>(`/reservas-actividad/mis-reservas/${id}`);
    return response.data;
  },

  /**
   * Consulta administrativa de todas las reservas de actividades en el hotel.
   * GET /api/reservas-actividad (exclusivo admin).
   */
  getAdminReservas: async (): Promise<ReservaActividad[]> => {
    const response = await api.get<ReservasActividadResponse>('/reservas-actividad');
    return response.data;
  },

  /**
   * Detalle individual administrativo de una reserva de actividad por ID.
   * GET /api/reservas-actividad/:id (exclusivo admin).
   */
  getAdminReservaById: async (id: number): Promise<ReservaActividad> => {
    const response = await api.get<ReservaActividadResponse>(`/reservas-actividad/${id}`);
    return response.data;
  },

  /**
   * Actualización del estado de una reserva de actividad por parte de administración.
   * PATCH /api/reservas-actividad/:id/estado (exclusivo admin).
   */
  updateEstadoReserva: async (
    id: number,
    data: UpdateReservaActividadInput
  ): Promise<ReservaActividad> => {
    const response = await api.patch<ReservaActividadResponse>(
      `/reservas-actividad/${id}/estado`,
      data
    );
    return response.data;
  },
};
