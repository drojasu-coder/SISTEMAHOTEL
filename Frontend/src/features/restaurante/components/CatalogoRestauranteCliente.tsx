import { useServiceSelection } from '@/features/preferencias/useServiceSelection';
import { MissingServiceSelection } from '@/components/shared/ServiceReservationPanel';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { CatalogLinkContext, CatalogPagination } from '@/components/shared/CatalogFilters';
import { CatalogState } from '@/components/shared/CatalogState';
import { ServiceMedia } from '@/components/shared/ServiceCard';
import { Button } from '@/components/ui/Button';
import { useCatalogUrl, useCatalogPage } from '@/features/preferencias/useCatalogUrl';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { useMesasQuery } from '../hooks/useReservasMesa';
import { ReservaMesaModal } from './ReservaMesaModal';
import { RestauranteMenu } from './RestauranteMenu';
import { useMenuCopy } from '../menuCopy';
import { RESTAURANTE_ROUTES } from '../constants/routes';
import type { MesaConSucursal } from '../types';
import { Info, MapPin, Search, Users, X } from 'lucide-react';

export function CatalogoRestauranteCliente() {
  const t = usePublicTexts('restaurante');
  const menuCopy = useMenuCopy();
  const { p, locale } = usePublicInterface();
  const { user, status } = useAuth();
  const scope = usePublicPreferences();
  const query = useMesasQuery();
  const all = query.data ?? [];
  const zones = [...new Set(all.map((item) => item.zona).filter(Boolean))].sort();
  const catalog = useCatalogUrl({ zona: query.isSuccess ? zones : undefined });
  const q = catalog.q.trim().toLowerCase();
  const siteName = (item: MesaConSucursal) => scope.sites.find((site) => site.id === item.sucursal_id)?.nombre || item.Sucursal?.nombre || (item.sucursal_id ? `#${item.sucursal_id}` : undefined);
  const selection = useServiceSelection(query.data ?? [], query.isSuccess);
  const selected = selection.selected;
  const filtered = all.filter((item) => scope.status === 'ready' && (scope.selected === 'all' || item.sucursal_id === scope.selected) && (!catalog.values.zona || item.zona === catalog.values.zona) && `${item.zona ?? ''} ${siteName(item) ?? ''}`.toLowerCase().includes(q));
  const paging = useCatalogPage(filtered, catalog, query.isSuccess && scope.status === 'ready');
  const currentSite = scope.sites.find((site) => site.id === scope.selected);
  // Solo se ofrecen las zonas de la sede visible; la validación de la URL sigue usando todas.
  const zoneOptions = [...new Set(all.filter((item) => scope.selected === 'all' || item.sucursal_id === scope.selected).map((item) => item.zona).filter(Boolean))].sort();
  const ready = query.isSuccess && !catalog.siteConflict && scope.status === 'ready';
  const hasFilters = Boolean(catalog.q || catalog.values.zona);
  return <PageContainer>
    <PageHeader eyebrow={t.subtitulo} title={t.titulo}
      action={status === 'authenticated' && user?.rol === 'cliente' ? <Link to={RESTAURANTE_ROUTES.MIS_RESERVAS} className={buttonStyles({ variant: 'ghost' })}>{t.cliente.misReservasTitulo}</Link> : undefined} />
    <CatalogLinkContext catalog={catalog} />
    {selection.missing && <MissingServiceSelection onClose={selection.close} />}
    {!catalog.siteConflict && <RestauranteMenu tablesHref="#mesas"
      media={currentSite?.restaurante_imagen_url ? <ServiceMedia src={currentSite.restaurante_imagen_url} alt={`${p('restaurant')} ${currentSite.nombre}`} altLang={locale} credits={currentSite.restaurante_imagen_creditos} /> : undefined} />}

    <section id="mesas" aria-labelledby="mesas-titulo" className="scroll-mt-40 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <h2 id="mesas-titulo" className="font-serif text-2xl font-semibold text-neutro-900">{menuCopy('tablesTitle')}</h2>
        {ready && <p role="status" aria-live="polite" className="text-sm font-medium text-neutro-700">{t.mesasMostradas(filtered.length)}</p>}
      </div>

      {/* Barra de búsqueda compacta: texto libre y zona, con el mismo estado en la URL. */}
      <div className="flex flex-col gap-3 border-y border-neutro-200 py-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{p('searchTables')}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
          <input type="search" value={catalog.q} onChange={(event) => catalog.setSearch(event.target.value)} placeholder={p('searchTables')}
            className="field-control !pl-9" />
        </label>
        <label className="flex min-w-0 items-center gap-2 sm:w-64">
          <MapPin className="size-4 shrink-0 text-bronce-600" aria-hidden="true" />
          <span className="sr-only">{t.zona}</span>
          <select value={catalog.values.zona} onChange={(event) => catalog.setFilter('zona', event.target.value)} className="field-control" disabled={!zoneOptions.length}>
            <option value="">{t.todasLasZonas}</option>
            {zoneOptions.map((zone) => <option key={zone} value={zone} lang="es">{zone}</option>)}
          </select>
        </label>
      </div>
      {hasFilters && <div className="flex flex-wrap items-center gap-2">
        {catalog.q && <button type="button" onClick={() => catalog.setSearch('')} aria-label={p('removeFilter', { value: catalog.q })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-bronce-200 bg-bronce-50 px-3 text-xs font-medium text-bronce-800 hover:border-bronce-400">“{catalog.q}”<X className="size-3.5" aria-hidden="true" /></button>}
        {catalog.values.zona && <button type="button" onClick={() => catalog.setFilter('zona', '')} aria-label={p('removeFilter', { value: catalog.values.zona })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-bronce-200 bg-bronce-50 px-3 text-xs font-medium text-bronce-800 hover:border-bronce-400"><span lang="es">{catalog.values.zona}</span><X className="size-3.5" aria-hidden="true" /></button>}
        <Button type="button" variant="text" size="sm" onClick={catalog.clear}>{p('resetFilters')}</Button>
      </div>}

      {!catalog.siteConflict && <CatalogState loading={query.isPending || scope.status === 'loading'} error={query.isError || scope.status === 'error'} total={all.length} siteCount={all.filter((item) => scope.selected === 'all' || item.sucursal_id === scope.selected).length} filteredCount={filtered.length} hasFilters={hasFilters} onClear={catalog.clear} onRetry={() => { void query.refetch(); if (scope.status === 'error') scope.retry(); }} errorTitle={t.errorCargar} emptyTitle={t.sinMesasTitulo} emptyDescription={t.sinMesasDesc}>
        {/* El estado de la mesa es su condición actual, no su disponibilidad para una fecha. */}
        <p className="flex items-start gap-2 text-xs text-neutro-600"><Info className="mt-0.5 size-3.5 shrink-0 text-bronce-600" aria-hidden="true" />{t.estadoNoDisponibilidad}</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{paging.items.map((item) => {
          const maintenance = item.estado === 'mantenimiento';
          return <li key={item.id}>
            <article className="flex h-full flex-col gap-3 rounded-xl border border-neutro-200 bg-white p-4 transition-colors hover:border-bronce-300">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg font-semibold text-neutro-900">{p('table')} #{item.id}</h3>
                <StatusBadge domain="table" value={item.estado} />
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutro-700">
                <li className="inline-flex items-center gap-1.5"><Users className="size-4 text-bronce-600" aria-hidden="true" /><span className="sr-only">{t.capacidad}: </span>{t.capacidadPersonas(item.capacidad)}</li>
                {item.zona && <li className="inline-flex min-w-0 items-center gap-1.5"><MapPin className="size-4 shrink-0 text-bronce-600" aria-hidden="true" /><span className="sr-only">{t.zona}: </span><span lang="es" className="truncate">{item.zona}</span></li>}
              </ul>
              {scope.selected === 'all' && <p className="text-xs text-neutro-500" lang="es">{siteName(item)}</p>}
              <Button variant="secondary" className="mt-auto w-full" disabled={maintenance} onClick={() => selection.select(item)}>{maintenance ? t.estadosMesa.mantenimiento : p('serviceViewReserve')}</Button>
            </article>
          </li>;
        })}</ul>
        <CatalogPagination catalog={catalog} {...paging} />
      </CatalogState>}
    </section>
    <ReservaMesaModal key={selected?.id} mesa={selected} isOpen={Boolean(selected)} onClose={selection.close} />
  </PageContainer>;
}
