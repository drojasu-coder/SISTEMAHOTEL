import { useEffect } from 'react';
import { Badge, type Tone } from './Badge';
import { useLocale } from '@/i18n/LocaleContext';
import { usePublicInterface } from '@/i18n/public';

type Entry = [string, string, Tone];
/** Mapas por dominio: nunca se deduce evidencia financiera del estado de una reserva. */
const reservation = { cotizacion: ['Cotización', 'Quote', 'info'], pendiente: ['Pendiente', 'Pending', 'advertencia'], confirmada: ['Confirmada', 'Confirmed', 'exito'], cancelada: ['Cancelada', 'Cancelled', 'neutro'], expirada: ['Expirada', 'Expired', 'neutro'], completada: ['Completada', 'Completed', 'exito'], cotizada: ['Cotizada', 'Quoted', 'info'], finalizada: ['Finalizada', 'Finished', 'neutro'] } satisfies Record<string, Entry>;
const domains: Record<string, Record<string, Entry>> = {
  reservation,
  payment: { procesando: ['Procesando', 'Processing', 'info'], reembolsado_parcial: ['Reembolso parcial', 'Partially refunded', 'neutro'], pendiente: ['Pendiente', 'Pending', 'advertencia'], aprobado: ['Aprobado', 'Approved', 'exito'], rechazado: ['Rechazado', 'Declined', 'error'], cancelado: ['Cancelado', 'Cancelled', 'neutro'], reembolsado: ['Reembolsado', 'Refunded', 'neutro'] },
  cart: { activo: ['Activo', 'Active', 'info'], pagado: ['Pagado', 'Paid', 'exito'], expirado: ['Expirado', 'Expired', 'neutro'], cancelado: ['Cancelado', 'Cancelled', 'neutro'] },
  room: { disponible: ['Disponible', 'Available', 'exito'], ocupada: ['Ocupada', 'Occupied', 'advertencia'], mantenimiento: ['Mantenimiento', 'Under maintenance', 'neutro'], limpieza: ['Limpieza', 'Cleaning', 'info'] },
  table: { disponible: ['Disponible', 'Available', 'exito'], ocupada: ['Actualmente ocupada', 'Currently occupied', 'advertencia'], mantenimiento: ['En mantenimiento', 'Under maintenance', 'neutro'] },
  service: { activa: ['Activa', 'Active', 'exito'], inactiva: ['Inactiva', 'Inactive', 'neutro'], disponible: ['Disponible', 'Available', 'exito'], agotado: ['Agotado', 'Sold out', 'neutro'] },
};
const reported = new Set<string>();
export function StatusBadge({ domain, value }: { domain: 'reservation' | 'payment' | 'cart' | 'room' | 'table' | 'service'; value: unknown }) {
  const { locale } = useLocale();
  const { p } = usePublicInterface();
  const entry = typeof value === 'string' && Object.hasOwn(domains[domain], value) ? domains[domain][value] : undefined;
  useEffect(() => {
    const key = `${domain}:${String(value)}`;
    if (!entry && !reported.has(key)) { reported.add(key); console.warn('[UI status] Unrecognized state', { domain, value }); }
  }, [domain, value, entry]);
  return <Badge tone={entry?.[2] ?? 'neutro'}>{entry ? entry[locale === 'en' ? 1 : 0] : p('unknownStatus')}</Badge>;
}
