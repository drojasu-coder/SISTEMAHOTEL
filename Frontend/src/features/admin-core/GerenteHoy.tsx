import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client/http';
import { useAdminScope } from './AdminScopeContext';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { useLocale } from '@/i18n/LocaleContext';

interface Registro { fecha?: string; estado?: string }
const MODULOS = [
  { id: 'restaurante', endpoint: '/reservas-mesa', to: '/admin/reservas-restaurante?vista=hoy', es: 'Reservas de restaurante', en: 'Restaurant reservations' },
  { id: 'actividades', endpoint: '/reservas-actividad', to: '/admin/reservas-actividades?vista=hoy', es: 'Actividades', en: 'Activities' },
  { id: 'bienestar', endpoint: '/citas-spa', to: '/admin/citas-spa?vista=hoy', es: 'Citas de bienestar', en: 'Wellness appointments' },
  { id: 'eventos', endpoint: '/reservas-evento', to: '/admin/reservas-evento?vista=hoy', es: 'Eventos', en: 'Events' },
  { id: 'amenidades', endpoint: '/reservas-amenidad', to: '/admin/reservas-amenidades', es: 'Amenidades', en: 'Amenities' },
] as const;

/**
 * Servicios programados para hoy en las sedes del gerente. Cada conteo sale del mismo
 * listado que usa su módulo, que el servidor ya limita a las sedes autorizadas.
 */
export function GerenteHoy() {
  const { locale } = useLocale();
  const { selectedSedeId } = useAdminScope();
  const today = getTodayInGuatemala();
  const sucursal = selectedSedeId === 'all' ? undefined : selectedSedeId;
  const en = locale === 'en';
  const queries = MODULOS.map(m => ({ m, q: useQuery({ // eslint-disable-line react-hooks/rules-of-hooks -- lista fija
    queryKey: ['gerente-hoy', m.id, sucursal, today], retry: false, staleTime: 30000,
    queryFn: async () => (await api.get<{ data: Registro[] }>(m.endpoint, { params: { sucursal_id: sucursal } })).data,
  }) }));
  return (
    <section aria-label={en ? 'Scheduled today' : 'Programado para hoy'} className="rounded-xl border border-neutro-200 bg-white p-4">
      <h2 className="font-sans text-sm font-semibold text-neutro-900">{en ? 'Scheduled today' : 'Programado para hoy'}</h2>
      <p className="text-xs text-neutro-500">{en ? 'Active bookings for today in your sites, excluding cancelled.' : 'Reservas activas de hoy en sus sedes, sin canceladas.'}</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-5">
        {queries.map(({ m, q }) => {
          const count = q.data?.filter(r => r.fecha?.slice(0, 10) === today && r.estado !== 'cancelada' && r.estado !== 'expirada').length;
          return <li key={m.id}><Link to={m.to} className="block rounded-lg border border-neutro-200 px-3 py-2 hover:bg-bronce-50">
            <span className="block text-xs text-neutro-500">{en ? m.en : m.es}</span>
            <span className="text-xl font-semibold tabular-nums text-neutro-900">{q.isLoading ? '…' : q.isError ? '—' : count}</span></Link></li>;
        })}
      </ul>
    </section>
  );
}
