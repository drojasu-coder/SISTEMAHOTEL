import { api } from '@/api/client/http';
import type {
  CreateReservaHabitacionInput,
  DisponibilidadHabitacionQuery,
  DisponibilidadHabitacionesResponse,
  HabitacionDisponible,
  ReservaHabitacion,
  ReservaHabitacionResponse,
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
    const response = await api.post<ReservaHabitacionResponse>(
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
   * Consulta el detalle de una reserva específica por identificador.
   * Endpoint: GET /api/reservas-habitacion/:id.
   *
   * Si la reserva pertenece a otro usuario, el backend responde HTTP 403 INSUFFICIENT_PERMISSIONS.
   */
  getById: async (id: number): Promise<ReservaHabitacion> => {
    const response = await api.get<ReservaHabitacionResponse>(
      `/reservas-habitacion/${id}`
    );
    return response.data;
  },
};
