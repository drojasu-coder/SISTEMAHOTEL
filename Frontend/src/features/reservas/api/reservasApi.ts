import { api } from '@/api/client/http';
import type {
  CreateReservaHabitacionInput,
  DisponibilidadHabitacionQuery,
  DisponibilidadHabitacionesResponse,
  HabitacionDisponible,
  ReservaHabitacion,
  ReservaHabitacionResponse,
  ReservaHabitacionCreatedResponse,
  ReservasHabitacionResponse,
} from '../types';

/**
 * Cliente HTTP para el dominio de reservas de habitación.
 *
 * Expone métodos unificados que retornan directamente la entidad de datos (data)
 * consumiendo el backend real.
 */
export const reservasApi = {
  /**
   * Consulta las habitaciones disponibles para una sede, rango de fechas y número de huéspedes.
   * Endpoint asignado en backend: GET /api/habitaciones/disponibles (BE-012).
   */
  getDisponibilidad: async (
    query: DisponibilidadHabitacionQuery
  ): Promise<HabitacionDisponible[]> => {
    const params: Record<string, string | number> = {
      sucursal_id: query.sucursal_id,
      fecha_entrada: query.fecha_entrada,
      fecha_salida: query.fecha_salida,
      numero_huespedes: query.numero_huespedes,
    };

    if (query.tipo_habitacion_id !== undefined) {
      params.tipo_habitacion_id = query.tipo_habitacion_id;
    }

    const response = await api.get<DisponibilidadHabitacionesResponse>(
      '/habitaciones/disponibles',
      { params }
    );
    return response.data;
  },

  /**
   * Crea una nueva reserva de habitación en estado "pendiente".
   * Endpoint: POST /api/reservas-habitacion.
   *
   * Para clientes, el backend asocia la reserva a req.user.id del token.
   * El payload contiene únicamente habitacion_id, fecha_entrada, fecha_salida y numero_huespedes.
   */
  create: async (
    data: CreateReservaHabitacionInput
  ): Promise<ReservaHabitacion> => {
    const response = await api.post<ReservaHabitacionCreatedResponse>(
      '/reservas-habitacion',
      data
    );
    return response.data;
  },

  /**
   * Consulta las reservas del usuario autenticado.
   * Endpoint: GET /api/reservas-habitacion.
   *
   * El backend filtra con exclusividad las reservas propias del cliente (where.usuario_id = req.user.id).
   */
  getAllMine: async (): Promise<ReservaHabitacion[]> => {
    const response = await api.get<ReservasHabitacionResponse>(
      '/reservas-habitacion'
    );
    return response.data;
  },

  /**
   * Consulta todas las reservas para personal administrativo autorizado.
   * Endpoint: GET /api/reservas-habitacion.
   *
   * Para roles administrativos (admin, recepcionista, gerente_habitaciones),
   * el backend no restringe por usuario_id y retorna el catálogo completo con relaciones.
   */
  getAllAdmin: async (sucursalId?: number): Promise<ReservaHabitacion[]> => {
    // La sede se filtra en el servidor, dentro del alcance autorizado del usuario.
    const response = await api.get<ReservasHabitacionResponse>(
      '/reservas-habitacion',
      { params: { sucursal_id: sucursalId } }
    );
    return response.data;
  },

  /**
   * Consulta el detalle de una reserva específica por identificador.
   * Endpoint: GET /api/reservas-habitacion/:id.
   *
   * Si la reserva pertenece a otro usuario y el solicitante no es personal administrativo,
   * el backend responde HTTP 403 INSUFFICIENT_PERMISSIONS.
   */
  getById: async (id: number): Promise<ReservaHabitacion> => {
    const response = await api.get<ReservaHabitacionResponse>(
      `/reservas-habitacion/${id}`
    );
    return response.data;
  },

  /**
   * Actualiza el estado u otros campos de una reserva (operación administrativa).
   * Endpoint: PATCH /api/reservas-habitacion/:id.
   */
  updateAdmin: async (
    id: number,
    data: { estado?: string; habitacion_id?: number; fecha_entrada?: string; fecha_salida?: string; numero_huespedes?: number }
  ): Promise<ReservaHabitacion> => {
    const response = await api.patch<ReservaHabitacionResponse>(
      `/reservas-habitacion/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Cancela lógicamente una reserva de habitación.
   * Endpoint: DELETE /api/reservas-habitacion/:id.
   */
  cancelAdmin: async (id: number): Promise<void> => {
    await api.delete(`/reservas-habitacion/${id}`);
  },
};
