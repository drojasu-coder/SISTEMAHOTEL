import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import type { CatalogUrl } from '@/features/preferencias/useCatalogUrl';
import { usePublicInterface } from '@/i18n/public';
import { useLocale } from '@/i18n/LocaleContext';

export type FilterOption = { value: string; label: string };

/** Claves de URL que filtran el catálogo (la ordenación no cuenta como filtro). */
export const ROOM_FILTER_KEYS = ['categoria', 'tipo_habitacion_id', 'capacidad', 'precio'] as const;

/**
 * Barra compacta de filtros del catálogo. Todo el estado vive en la URL
 * (useCatalogUrl), así que los filtros se conservan al navegar y recargar.
 * En escritorio los filtros quedan a la vista; en móvil se abren en un panel.
 */
export function RoomCatalogFilters({ catalog, types, capacities, prices, orders, count }: {
  catalog: CatalogUrl;
  types: FilterOption[];
  capacities: number[];
  prices: FilterOption[];
  orders: FilterOption[];
  count?: number;
}) {
  const { p } = usePublicInterface();
  const { t } = useLocale();
  const [panel, setPanel] = useState(false);
  const label = (options: FilterOption[], value: string) => options.find((option) => option.value === value)?.label ?? value;
  const active = [
    ...(catalog.values.categoria ? [{ key: 'categoria', text: label(types, catalog.values.categoria) }] : []),
    ...(catalog.values.tipo_habitacion_id ? [{ key: 'tipo_habitacion_id', text: p('roomTypeFilter') }] : []),
    ...(catalog.values.capacidad ? [{ key: 'capacidad', text: `${p('roomGuestsFilter')}: ${p('roomGuestsFor', { count: catalog.values.capacidad })}` }] : []),
    ...(catalog.values.precio ? [{ key: 'precio', text: label(prices, catalog.values.precio) }] : []),
  ];

  const fields = (layout: 'bar' | 'panel') => {
    const cls = layout === 'bar' ? 'min-w-0' : '';
    return <>
      <div className={cls}>
        <Select label={p('roomTypeFilter')} value={catalog.values.categoria} disabled={!types.length} onChange={(event) => catalog.updateParams({ categoria: event.target.value, tipo_habitacion_id: null, page: null })}>
          <option value="">{p('roomTypeAny')}</option>
          {types.map((option) => <option key={option.value} value={option.value} lang="es">{option.label}</option>)}
        </Select>
      </div>
      <div className={cls}>
        <Select label={p('roomGuestsFilter')} value={catalog.values.capacidad} disabled={!capacities.length} onChange={(event) => catalog.setFilter('capacidad', event.target.value)}>
          <option value="">{p('roomGuestsAny')}</option>
          {capacities.map((capacity) => <option key={capacity} value={String(capacity)}>{p('roomGuestsFor', { count: capacity })}</option>)}
        </Select>
      </div>
      <div className={cls}>
        <Select label={p('roomPriceFilter')} value={catalog.values.precio} disabled={!prices.length} onChange={(event) => catalog.setFilter('precio', event.target.value)}>
          <option value="">{p('roomPriceAny')}</option>
          {prices.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      </div>
    </>;
  };

  const sort = <Select label={p('roomSort')} value={catalog.values.orden} onChange={(event) => catalog.setFilter('orden', event.target.value)}>
    <option value="">{p('roomSortDefault')}</option>
    {orders.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </Select>;

  return <div className="space-y-3">
    {/* Escritorio y tablet: filtros a la vista en una sola fila. */}
    <div className="hidden items-end gap-3 border-y border-neutro-200 py-4 md:grid md:grid-cols-4 lg:gap-4">
      {fields('bar')}
      <div className="min-w-0 border-l border-neutro-200 pl-3 lg:pl-4">{sort}</div>
    </div>

    {/* Móvil: botón de filtros que abre un panel, y orden a la vista. */}
    <div className="flex items-end gap-3 border-y border-neutro-200 py-3 md:hidden">
      <Button type="button" variant="secondary" className="shrink-0 gap-2" aria-haspopup="dialog" aria-expanded={panel} onClick={() => setPanel(true)}>
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        {active.length ? p('roomFiltersCount', { count: active.length }) : p('filters')}
      </Button>
      <div className="min-w-0 flex-1">{sort}</div>
    </div>

    {active.length > 0 && <div className="flex flex-wrap items-center gap-2">
      {active.map((filter) => <button key={filter.key} type="button" onClick={() => catalog.setFilter(filter.key, '')} aria-label={p('removeFilter', { value: filter.text })}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-bronce-200 bg-bronce-50 px-3 text-xs font-medium text-bronce-800 transition-colors hover:border-bronce-400">
        <span lang="es">{filter.text}</span><X className="size-3.5" aria-hidden="true" />
      </button>)}
      <Button type="button" variant="text" size="sm" onClick={() => catalog.updateParams(Object.fromEntries([...ROOM_FILTER_KEYS, 'page'].map((key) => [key, null])))}>{p('roomClearFilters')}</Button>
    </div>}

    <Drawer open={panel} onClose={() => setPanel(false)} title={p('filters')} closeLabel={t('close')} className="!max-w-sm">
      <div className="flex flex-col gap-4">
        {fields('panel')}
        <div className="mt-2 flex flex-col gap-2 border-t border-neutro-200 pt-4">
          <Button type="button" onClick={() => setPanel(false)}>
            {count === undefined ? p('showResults') : count === 1 ? p('roomShowOne') : p('roomShowCount', { count })}
          </Button>
          {active.length > 0 && <Button type="button" variant="ghost" onClick={() => catalog.updateParams(Object.fromEntries([...ROOM_FILTER_KEYS, 'page'].map((key) => [key, null])))}>{p('roomClearFilters')}</Button>}
        </div>
      </div>
    </Drawer>
  </div>;
}
