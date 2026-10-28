import { api } from "@/api/client/http";
import type {
  MesaConSucursal,
  ReservaMesa,
  ReservaMesaResponse,
  ReservasMesaResponse,
  CreateReservaMesaInput,
  UpdateReservaMesaEstadoInput,
  ProductoMenu,
  Restaurante,
} from "../types";

export const restauranteApi = {
  /**
   * Restaurantes activos, uno por sede, con resumen de mesas.
   * GET /api/restaurantes
   */
  getRestaurantes: async (): Promise<Restaurante[]> => {
    const response = await api.get<{ status: string; data: Restaurante[] }>("/restaurantes");
    return response.data;
  },

  /**
   * Carta completa del restaurante; los productos no disponibles llegan marcados.
   * GET /api/restaurantes/:id/menu?incluir_no_disponibles=true
   */
  getMenu: async (restauranteId: number): Promise<ProductoMenu[]> => {
    const response = await api.get<{ status: string; data: ProductoMenu[] }>(
      `/restaurantes/${restauranteId}/menu?incluir_no_disponibles=true`
    );
    return response.data;
  },

  /**
   * Consulta pública de mesas del restaurante con su sucursal.
   * GET /api/mesas
   */
  getMesas: async (): Promise<MesaConSucursal[]> => {
    const response = await api.get<{ status: string; data: MesaConSucursal[] }>("/mesas");
    return response.data;
  },

  /**
   * Creación de reserva de mesa para el cliente autenticado.
   * POST /api/reservas-mesa
   */
  createReserva: async (data: CreateReservaMesaInput): Promise<ReservaMesa> => {
    const response = await api.post<ReservaMesaResponse>("/reservas-mesa", data);
    return response.data;
  },

  /**
   * Listado de reservas de mesa del cliente autenticado.
   * GET /api/reservas-mesa/mis-reservas
   */
  getMyReservas: async (): Promise<ReservaMesa[]> => {
    const response = await api.get<ReservasMesaResponse>("/reservas-mesa/mis-reservas");
    return response.data;
  },

  /**
   * Detalle individual de reserva de mesa del cliente autenticado.
   * GET /api/reservas-mesa/mis-reservas/:id
   */
  getMyReservaById: async (id: number): Promise<ReservaMesa> => {
    const response = await api.get<ReservaMesaResponse>(`/reservas-mesa/mis-reservas/${id}`);
    return response.data;
  },

  /**
   * Consulta administrativa de todas las reservas de restaurante del hotel.
   * GET /api/reservas-mesa (exclusivo admin).
   */
  getAdminReservas: async (sucursalId?: number): Promise<ReservaMesa[]> => {
    // La sede se filtra en el servidor, dentro del alcance autorizado del usuario.
    const response = await api.get<ReservasMesaResponse>("/reservas-mesa", {
      params: { sucursal_id: sucursalId },
    });
    return response.data;
  },

  /**
   * Consulta administrativa del detalle de una reserva por su ID.
   * GET /api/reservas-mesa/:id (exclusivo admin).
   */
  getAdminReservaById: async (id: number): Promise<ReservaMesa> => {
    const response = await api.get<ReservaMesaResponse>(`/reservas-mesa/${id}`);
    return response.data;
  },

  /**
   * Actualización administrativa del estado de una reserva (confirmada / cancelada).
   * PATCH /api/reservas-mesa/:id/estado (exclusivo admin).
   */
  updateEstadoReserva: async (
    id: number,
    data: UpdateReservaMesaEstadoInput
  ): Promise<ReservaMesa> => {
    const response = await api.patch<ReservaMesaResponse>(
      `/reservas-mesa/${id}/estado`,
      data
    );
    return response.data;
  },
};
