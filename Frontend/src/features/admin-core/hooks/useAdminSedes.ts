import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/api/client/http';
import { useAuth } from '@/features/auth/AuthContext';
import { canAccessPanel } from '@/features/auth/permissions';

const scopeSchema = z.object({
  global: z.boolean(),
  sedes: z.array(z.object({ id: z.number().int().positive(), nombre: z.string(), activa: z.boolean() })),
});
export type AdminSede = z.infer<typeof scopeSchema>['sedes'][number];

/** Site options come from the existing backend scope, never from the public catalog. */
export function useAdminSedes(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['admin-sede-scope', user?.id, user?.rol],
    enabled: enabled && Boolean(user && canAccessPanel(user.rol)),
    queryFn: async ({ signal }) => {
      // Endpoint de solo alcance: disponible para todo rol con panel, sin acceso a las métricas del dashboard.
      const response = await api.get<{ data: unknown }>('/admin/alcance', { signal });
      return scopeSchema.parse(response.data);
    },
    retry: false, staleTime: 60000,
  });
}
