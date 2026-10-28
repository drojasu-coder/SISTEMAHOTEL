import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { restauranteApi } from "../api/restauranteApi";
import { restauranteQueryKeys } from "../constants/queryKeys";
import type {
  CreateReservaMesaInput,
  UpdateReservaMesaEstadoInput,
} from "../types";

/**
 * Consulta de mesas disponibles en el restaurante por sede.
 */
export const useMesasQuery = () => {
  return useQuery({
    queryKey: restauranteQueryKeys.mesas(),
    queryFn: restauranteApi.getMesas,
  });
};

/** Restaurantes públicos (uno por sede). */
export const useRestaurantesQuery = () => {
  return useQuery({
    queryKey: restauranteQueryKeys.restaurantes(),
    queryFn: restauranteApi.getRestaurantes,
  });
};

/** Carta del restaurante, incluidos los productos marcados como no disponibles. */
export const useMenuQuery = (restauranteId?: number) => {
  return useQuery({
    queryKey: restauranteQueryKeys.menu(restauranteId ?? 0),
    queryFn: () => restauranteApi.getMenu(restauranteId!),
    enabled: Boolean(restauranteId),
  });
};

/**
 * Mutación para crear una reserva de mesa por el cliente.
 * Invalida las listas de reservas al confirmarse.
 */
export const useCreateReservaMesaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReservaMesaInput) => restauranteApi.createReserva(data),
    retry: false, // Regla estricta: sin reintentos automáticos del POST
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: restauranteQueryKeys.reservas.all,
      });
    },
  });
};

/**
 * Consulta del listado de reservas de mesa del cliente autenticado.
 * Aislada estrictamente por identificador de usuario en la clave de caché.
 */
export const useMisReservasMesaQuery = (userId?: number, isCliente = false) => {
  return useQuery({
    queryKey: restauranteQueryKeys.reservas.list(userId),
    queryFn: restauranteApi.getMyReservas,
    enabled: isCliente && typeof userId === "number" && userId > 0,
    staleTime: 1000 * 60,
  });
};

/**
 * Consulta del detalle de una reserva de mesa del cliente autenticado.
 * Aislada por reserva y usuario en la caché.
 */
export const useMiReservaMesaDetalleQuery = (
  id?: number,
  userId?: number,
  isCliente = false
) => {
  return useQuery({
    queryKey: restauranteQueryKeys.reservas.detail(id ?? 0, userId),
    queryFn: () => restauranteApi.getMyReservaById(id!),
    enabled:
      isCliente &&
      typeof userId === "number" &&
      userId > 0 &&
      typeof id === "number" &&
      id > 0,
    retry: false,
  });
};

/**
 * Consulta administrativa de todas las reservas de restaurante del hotel.
 */
export const useAdminReservasMesaQuery = (
  userId?: number,
  isAdmin = false,
  sucursalId: number | "all" = "all"
) => {
  return useQuery({
    queryKey: restauranteQueryKeys.reservas.adminList(userId, sucursalId),
    queryFn: () => restauranteApi.getAdminReservas(sucursalId === "all" ? undefined : sucursalId),
    enabled: isAdmin && typeof userId === "number" && userId > 0,
    staleTime: 1000 * 30,
  });
};

/**
 * Consulta administrativa del detalle de una reserva de restaurante.
 */
export const useAdminReservaMesaDetalleQuery = (
  id?: number,
  userId?: number,
  isAdmin = false
) => {
  return useQuery({
    queryKey: restauranteQueryKeys.reservas.adminDetail(id ?? 0, userId),
    queryFn: () => restauranteApi.getAdminReservaById(id!),
    enabled:
      isAdmin &&
      typeof userId === "number" &&
      userId > 0 &&
      typeof id === "number" &&
      id > 0,
    retry: false,
  });
};

/**
 * Mutación administrativa para cambiar el estado de una reserva (confirmada / cancelada).
 */
export const useUpdateEstadoReservaMesaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateReservaMesaEstadoInput;
    }) => restauranteApi.updateEstadoReserva(id, data),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: restauranteQueryKeys.reservas.all,
      });
    },
  });
};
