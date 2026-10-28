import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bienestarApi } from '../api/bienestarApi';
import { bienestarQueryKeys } from '../constants/queryKeys';
import type {
  CreateCitaBienestarInput,
  CreateServicioBienestarInput,
  UpdateServicioBienestarInput,
  CreateTerapeutaInput,
  UpdateTerapeutaInput,
  UpdateCitaBienestarEstadoInput,
} from '../types';

// Servicios Queries
export function useServiciosSpaQuery() {
  return useQuery({
    queryKey: bienestarQueryKeys.servicios,
    queryFn: () => bienestarApi.getServicios(),
  });
}

export function useServicioSpaQuery(id: number) {
  return useQuery({
    queryKey: bienestarQueryKeys.servicio(id),
    queryFn: () => bienestarApi.getServicioById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

// Terapeutas Queries
export function useTerapeutasQuery(enabled = true) {
  return useQuery({
    queryKey: bienestarQueryKeys.terapeutas,
    queryFn: () => bienestarApi.getTerapeutas(),
    enabled,
  });
}

export function useTerapeutaQuery(id: number) {
  return useQuery({
    queryKey: bienestarQueryKeys.terapeuta(id),
    queryFn: () => bienestarApi.getTerapeutaById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

// Mis Citas (Cliente)
export function useMisCitasSpaQuery(userId?: number) {
  return useQuery({
    queryKey: bienestarQueryKeys.misCitas(userId),
    queryFn: () => bienestarApi.getMisCitas(),
    enabled: Boolean(userId),
  });
}

export function useMiCitaSpaQuery(id: number, userId?: number) {
  return useQuery({
    queryKey: bienestarQueryKeys.miCita(id, userId),
    queryFn: () => bienestarApi.getMiCitaById(id),
    enabled: Boolean(userId) && Number.isInteger(id) && id > 0,
  });
}

// Admin Citas
export function useAdminCitasSpaQuery() {
  return useQuery({
    queryKey: bienestarQueryKeys.adminCitas,
    queryFn: () => bienestarApi.getAdminCitas(),
  });
}

export function useAdminCitaSpaQuery(id: number) {
  return useQuery({
    queryKey: bienestarQueryKeys.adminCita(id),
    queryFn: () => bienestarApi.getAdminCitaById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

// Mutations
export function useCreateCitaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCitaBienestarInput) => bienestarApi.createCita(data),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['citas-bienestar'] });
    },
  });
}

export function useCreateServicioSpaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServicioBienestarInput) => bienestarApi.createServicio(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bienestarQueryKeys.servicios });
    },
  });
}

export function useUpdateServicioSpaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServicioBienestarInput }) =>
      bienestarApi.updateServicio(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: bienestarQueryKeys.servicios });
      void queryClient.invalidateQueries({ queryKey: bienestarQueryKeys.servicio(variables.id) });
    },
  });
}

export function useUploadServicioSpaImageMutation() {
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
    }) => bienestarApi.uploadServicioImage(id, file, onProgress),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: bienestarQueryKeys.servicios });
      void queryClient.invalidateQueries({ queryKey: bienestarQueryKeys.servicio(variables.id) });
    },
  });
}

export function useRemoveServicioSpaImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bienestarApi.removeServicioImage(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: bienestarQueryKeys.servicios });
      void queryClient.invalidateQueries({ queryKey: bienestarQueryKeys.servicio(id) });
    },
  });
}

export function useCreateTerapeutaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTerapeutaInput) => bienestarApi.createTerapeuta(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bienestarQueryKeys.terapeutas });
    },
  });
}

export function useUpdateTerapeutaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTerapeutaInput }) =>
      bienestarApi.updateTerapeuta(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: bienestarQueryKeys.terapeutas });
      void queryClient.invalidateQueries({ queryKey: bienestarQueryKeys.terapeuta(variables.id) });
    },
  });
}

export function useUpdateCitaEstadoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCitaBienestarEstadoInput }) =>
      bienestarApi.updateAdminCitaEstado(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['citas-bienestar'] });
      void queryClient.invalidateQueries({ queryKey: bienestarQueryKeys.adminCita(variables.id) });
    },
  });
}
