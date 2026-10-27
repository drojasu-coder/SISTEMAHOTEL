import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventosApi } from '../api/eventosApi';
import { eventosQueryKeys } from '../constants/queryKeys';
import type {
  CreateSalonInput,
  UpdateSalonInput,
  CreateServicioEventoInput,
  UpdateServicioEventoInput,
  CreateReservaEventoInput,
  UpdateReservaEventoEstadoInput,
  AddReservaEventoServicioInput,
} from '../types';

// ==========================================
// QUERIES
// ==========================================

export function useSalonesQuery(params?: { sucursal_id?: number }) {
  return useQuery({
    queryKey: eventosQueryKeys.salones(params),
    queryFn: () => eventosApi.getSalones(params),
  });
}

export function useSalonQuery(id: number) {
  return useQuery({
    queryKey: eventosQueryKeys.salon(id),
    queryFn: () => eventosApi.getSalonById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useServiciosEventoQuery() {
  return useQuery({
    queryKey: eventosQueryKeys.allServicios,
    queryFn: () => eventosApi.getServiciosEvento(),
  });
}

export function useServicioEventoQuery(id: number) {
  return useQuery({
    queryKey: eventosQueryKeys.servicio(id),
    queryFn: () => eventosApi.getServicioEventoById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useMisReservasEventosQuery(userId?: number) {
  return useQuery({
    queryKey: eventosQueryKeys.misReservas(userId),
    queryFn: () => eventosApi.getReservas(),
    enabled: Boolean(userId),
  });
}

export function useMiReservaEventoQuery(id: number, userId?: number) {
  return useQuery({
    queryKey: eventosQueryKeys.miReserva(id, userId),
    queryFn: () => eventosApi.getReservaById(id),
    enabled: Boolean(userId) && Number.isInteger(id) && id > 0,
  });
}

export function useReservaServiciosQuery(reservaId: number) {
  return useQuery({
    queryKey: eventosQueryKeys.reservaServicios(reservaId),
    queryFn: () => eventosApi.getReservaServicios(reservaId),
    enabled: Number.isInteger(reservaId) && reservaId > 0,
  });
}

export function useAdminReservasEventosQuery(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: eventosQueryKeys.adminReservas(filters),
    queryFn: () => eventosApi.getReservas(filters),
  });
}

export function useAdminReservaEventoQuery(id: number) {
  return useQuery({
    queryKey: eventosQueryKeys.adminReserva(id),
    queryFn: () => eventosApi.getReservaById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

// ==========================================
// MUTATIONS
// ==========================================

export function useCreateReservaEventoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReservaEventoInput) => eventosApi.createReserva(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allReservas });
    },
  });
}

export function useCancelarReservaEventoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventosApi.cancelarReserva(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allReservas });
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.adminReserva(id) });
    },
  });
}

export function useAddServicioToReservaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reservaId,
      data,
    }: {
      reservaId: number;
      data: AddReservaEventoServicioInput;
    }) => eventosApi.addServicioToReserva(reservaId, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.reservaServicios(variables.reservaId),
      });
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allReservas });
    },
  });
}

export function useRemoveServicioFromReservaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reservaId, id }: { reservaId: number; id: number }) =>
      eventosApi.removeServicioFromReserva(reservaId, id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.reservaServicios(variables.reservaId),
      });
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allReservas });
    },
  });
}

export function useCreateSalonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSalonInput) => eventosApi.createSalon(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allSalones });
    },
  });
}

export function useUpdateSalonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSalonInput }) =>
      eventosApi.updateSalon(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allSalones });
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.salon(variables.id) });
    },
  });
}

export function useDeleteSalonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventosApi.deleteSalon(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allSalones });
    },
  });
}

export function useUploadSalonImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      file,
      onProgress,
    }: {
      id: number;
      file: File;
      onProgress?: (pct: number) => void;
    }) => eventosApi.uploadSalonImage(id, file, onProgress),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allSalones });
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.salon(variables.id) });
    },
  });
}

export function useRemoveSalonImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventosApi.removeSalonImage(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allSalones });
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.salon(id) });
    },
  });
}

export function useCreateServicioEventoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServicioEventoInput) => eventosApi.createServicioEvento(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allServicios });
    },
  });
}

export function useUpdateServicioEventoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServicioEventoInput }) =>
      eventosApi.updateServicioEvento(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allServicios });
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.servicio(variables.id) });
    },
  });
}

export function useDeleteServicioEventoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventosApi.deleteServicioEvento(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allServicios });
    },
  });
}

export function useUpdateReservaEventoEstadoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateReservaEventoEstadoInput }) =>
      eventosApi.updateReservaEstado(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.allReservas });
      void queryClient.invalidateQueries({ queryKey: eventosQueryKeys.adminReserva(variables.id) });
    },
  });
}
