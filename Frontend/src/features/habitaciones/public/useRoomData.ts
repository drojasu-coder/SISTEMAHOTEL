import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { habitacionesApi } from '../api/habitacionesApi';
import { fetchRoomAvailability, type RoomCriteria } from './roomSearch';
import { calculateSedesRenewalDelay } from '@/features/sedes/hooks/useSedes';

function renewalDelay(data: unknown): number | false {
  const rows = Array.isArray(data) ? data : data && typeof data === 'object' && 'rooms' in data ? (data as { rooms: unknown[] }).rooms : [data];
  const media = rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const record = row as { imagen_url?: string; imagen_expires_at?: string | number | null };
    return [{ imagen_url: record.imagen_url, imagen_expires_at: record.imagen_expires_at }];
  });
  return calculateSedesRenewalDelay(media, false);
}
export function useRoomCatalog() {
  const { status, user } = useAuth();
  return useQuery({ queryKey: ['habitaciones-public-ui', user?.id, 'catalog'], queryFn: habitacionesApi.getAll, enabled: status === 'authenticated' && user?.rol === 'cliente', staleTime: 0, refetchOnMount: 'always', refetchInterval: (query) => query.isActive() && !query.state.error ? renewalDelay(query.state.data) : false });
}
export function useRoomDetail(id: number) {
  const { status, user } = useAuth();
  return useQuery({ queryKey: ['habitaciones-public-ui', user?.id, 'detail', id], queryFn: () => habitacionesApi.getById(id), enabled: status === 'authenticated' && user?.rol === 'cliente' && Number.isSafeInteger(id) && id > 0, staleTime: 0, refetchOnMount: 'always', refetchInterval: (query) => !query.state.error ? renewalDelay(query.state.data) : false });
}
export function useRoomAvailability(criteria: RoomCriteria, sites: number[], enabled: boolean) {
  const { status, user } = useAuth();
  return useQuery({ queryKey: ['habitaciones-public-ui', user?.id, 'availability', criteria, sites], queryFn: ({ signal }) => fetchRoomAvailability(criteria, sites, () => signal.aborted), enabled: enabled && sites.length > 0 && status === 'authenticated' && user?.rol === 'cliente', retry: false, staleTime: 0, refetchOnMount: 'always', refetchInterval: (query) => !query.state.error ? renewalDelay(query.state.data) : false });
}
