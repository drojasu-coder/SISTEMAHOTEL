import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Link } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import type { CatalogUrl } from '@/features/preferencias/useCatalogUrl';
import { usePublicInterface, usePublicTexts } from '@/i18n/public';

export function RoomCatalogFilters({ catalog, types, capacities, count }: {
  catalog: CatalogUrl; types: Record<string, string>; capacities: number[]; count?: number;
}) {
  const { p } = usePublicInterface();
  const t = usePublicTexts('crearReserva');
  const orders: Record<string, string> = { precio_asc: p('roomPriceAsc'), precio_desc: p('roomPriceDesc'), capacidad: p('roomCapacityOrder') };
  const active = [
    ...(catalog.q ? [{ key: 'q', label: catalog.q }] : []),
    ...(catalog.values.capacidad ? [{ key: 'capacidad', label: p('stayFitsGuests', { count: catalog.values.capacidad }) }] : []),
    ...(catalog.values.orden ? [{ key: 'orden', label: orders[catalog.values.orden] }] : []),
  ];
  const filtered = Boolean(catalog.values.tipo_habitacion_id || active.length);
  return <div className="surface space-y-4 p-4 sm:p-5">
    <div className="space-y-2" role="group" aria-label={t.tipoHabitacionLabel}>
      <p className="text-xs font-semibold text-neutro-700">{t.tipoHabitacionLabel}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={!catalog.values.tipo_habitacion_id ? 'primary' : 'secondary'} aria-pressed={!catalog.values.tipo_habitacion_id} onClick={() => catalog.setFilter('tipo_habitacion_id', '')}>{t.tipoHabitacionTodos}</Button>
        {Object.entries(types).map(([id, name]) => <Button key={id} size="sm" lang="es" variant={catalog.values.tipo_habitacion_id === id ? 'primary' : 'secondary'} aria-pressed={catalog.values.tipo_habitacion_id === id} onClick={() => catalog.setFilter('tipo_habitacion_id', catalog.values.tipo_habitacion_id === id ? '' : id)}>{name}</Button>)}
      </div>
    </div>
    <details className="border-t border-neutro-200 pt-2">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-neutro-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bronce-600">{p('stayMoreFilters')}</summary>
      <div className="grid gap-4 py-3 sm:grid-cols-2 lg:grid-cols-3">
        <Select label={p('stayCapacity')} value={catalog.values.capacidad} onChange={(event) => catalog.setFilter('capacidad', event.target.value)}>
          <option value="">{p('stayAnyCapacity')}</option>
          {capacities.map((capacity) => <option key={capacity} value={String(capacity)}>{p('stayFitsGuests', { count: capacity })}</option>)}
        </Select>
        <Select label={p('roomOrder')} value={catalog.values.orden} onChange={(event) => catalog.setFilter('orden', event.target.value)}>
          <option value="">{p('roomOrderDefault')}</option>
          {Object.entries(orders).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <Input type="search" label={p('roomKeyword')} value={catalog.q} onChange={(event) => catalog.setSearch(event.target.value)} />
      </div>
    </details>
    <div className="flex flex-wrap items-center gap-2">
      {active.map((filter) => <Button key={filter.key} size="sm" variant="ghost" aria-label={p('removeFilter', { value: filter.label })} onClick={() => catalog.setFilter(filter.key, '')}>{filter.label} ×</Button>)}
      {filtered && <Button variant="text" size="sm" onClick={catalog.clear}>{p('resetFilters')}</Button>}
      <Link to={catalog.shareHref} className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-xs text-neutro-500 underline-offset-2 hover:text-bronce-700 hover:underline"><Link2 className="size-3.5" aria-hidden="true" />{p('shareResults')}</Link>
    </div>
    {count !== undefined && <p role="status" aria-live="polite" className="text-sm text-neutro-600">{p(count === 1 ? 'resultOne' : 'resultMany', { count })}</p>}
  </div>;
}
