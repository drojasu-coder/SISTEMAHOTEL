import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/api/client/http';
import { useAuth } from '@/features/auth/AuthContext';

const count = z.number().int().nonnegative();
const reservation = z.object({
  id: z.number(), habitacion_numero: z.string(), tipo_habitacion: z.string(),
  sucursal_id: z.number(), sucursal_nombre: z.string(), fecha_entrada: z.string(), fecha_salida: z.string(),
  numero_huespedes: count, estado: z.string(), createdAt: z.string(), updatedAt: z.string(),
});
const dashboardSchema = z.object({
  fecha_consulta: z.string(), consultado_en: z.string(), sucursal_filtro: z.number().nullable(),
  resumen: z.object({
    total_habitaciones: count, habitaciones_disponibles: count, habitaciones_ocupadas: count,
    habitaciones_mantenimiento: count, habitaciones_limpieza: count, habitaciones_otro_estado: count,
    porcentaje_ocupacion: z.number().finite().nonnegative().nullable(), reservas_activas: count,
    llegadas_hoy: count, salidas_hoy: count, reservas_pendientes: count,
  }),
  llegadas: z.array(reservation), salidas: z.array(reservation), reservas_recientes: z.array(reservation),
  pendientes_atencion: z.array(z.object({
    tipo: z.literal('reserva_pendiente'), id: z.number(), habitacion_numero: z.string(),
    sucursal_nombre: z.string(), fecha: z.string(), link: z.string(),
  })),
});
export type DashboardData = z.infer<typeof dashboardSchema>;
export type DashboardReservaReciente = z.infer<typeof reservation>;

export function useAdminDashboard(sucursalId: number | 'all', enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['admin-dashboard', user?.id, user?.rol, sucursalId],
    enabled: enabled && Boolean(user?.id),
    queryFn: async ({ signal }) => {
      const response = await api.get<{ data: unknown }>('/admin/dashboard', {
        params: { sucursal_id: sucursalId === 'all' ? undefined : sucursalId }, signal,
      });
      const result = dashboardSchema.parse(response.data);
      if (result.sucursal_filtro !== (sucursalId === 'all' ? null : sucursalId)) throw new Error('El resumen no corresponde a la sede solicitada');
      return result;
    },
    retry: false, staleTime: 60000, refetchInterval: 120000,
  });
}
