import { useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Alert } from '@/components/ui/Feedback';
import { usePublicInterface } from '@/i18n/public';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import type { CatalogUrl } from '@/features/preferencias/useCatalogUrl';

type Filter = { key: string; label: string; all: string; options: readonly string[]; labels?: Record<string, string>; lang?: string };
export function CatalogFilters({ catalog, searchLabel, placeholder, filters = [], count, resultLabel, extraFilters, activeFilterLabels = {} }: {
  catalog: CatalogUrl; searchLabel: string; placeholder?: string; filters?: Filter[]; count?: number; resultLabel?: string; extraFilters?: ReactNode; activeFilterLabels?: Record<string, string>;
}) {
  const { p } = usePublicInterface();
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  const selected = filters.filter((filter) => catalog.values[filter.key]);
  const controls = (suffix: string) => filters.map((filter) => <Select key={filter.key} id={`${id}-${suffix}-${filter.key}`} label={filter.label} value={catalog.values[filter.key]} onChange={(event) => catalog.setFilter(filter.key, event.target.value)}>
    <option value="">{filter.all}</option>{filter.options.map((option) => <option key={option} value={option} lang={filter.lang ?? 'es'}>{filter.labels?.[option] ?? option}</option>)}
  </Select>);
  return <div className="surface space-y-4 p-4 sm:p-5">
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="min-w-0 flex-1"><Input type="search" label={searchLabel} placeholder={placeholder ?? searchLabel} value={catalog.q} onChange={(event) => catalog.setSearch(event.target.value)} /></div>
      {!open && <div className="hidden min-w-0 flex-wrap gap-4 md:flex">{controls('desktop')}{extraFilters}</div>}
      {(filters.length > 0 || extraFilters) && <Button ref={trigger} className="md:hidden" variant="ghost" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>{p('filters')}</Button>}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {catalog.q && <Button variant="ghost" size="sm" aria-label={p('removeFilter', { value: catalog.q })} onClick={() => catalog.setSearch('')}>{catalog.q} ×</Button>}
      {selected.map((filter) => <Button key={filter.key} variant="ghost" size="sm" aria-label={p('removeFilter', { value: filter.labels?.[catalog.values[filter.key]] ?? catalog.values[filter.key] })} onClick={() => catalog.setFilter(filter.key, '')}><span lang={filter.lang ?? 'es'}>{filter.labels?.[catalog.values[filter.key]] ?? catalog.values[filter.key]}</span> ×</Button>)}
      {Object.entries(activeFilterLabels).filter(([key]) => catalog.values[key]).map(([key, label]) => <Button key={key} variant="ghost" size="sm" aria-label={p('removeFilter', { value: `${label}: ${catalog.values[key]}` })} onClick={() => catalog.setFilter(key, '')}>{label}: {catalog.values[key]} ×</Button>)}
      {(catalog.q || Object.values(catalog.values).some(Boolean)) && <Button variant="text" size="sm" onClick={catalog.clear}>{p('resetFilters')}</Button>}
      <Link to={catalog.shareHref} className="ml-auto inline-flex min-h-11 items-center text-sm text-bronce-700 underline">{p('shareResults')}</Link>
    </div>
    {count !== undefined && <p role="status" className="text-sm text-neutro-600">{resultLabel ?? p(count === 1 ? 'resultOne' : 'resultMany', { count })}</p>}
    <Modal open={open} title={p('filters')} onClose={close} closeLabel={p('closeModal')}><div className="space-y-4">{controls('mobile')}{extraFilters}<Button variant="secondary" className="w-full" onClick={close}>{p('showResults')}</Button></div></Modal>
  </div>;
}

export function CatalogLinkContext({ catalog }: { catalog: CatalogUrl }) {
  const { p } = usePublicInterface();
  const { sites, status } = usePublicPreferences();
  if (!catalog.siteConflict) return null;
  const site = sites.find((item) => item.id === catalog.linkSite);
  const canApply = catalog.linkSite === 'all' || Boolean(site);
  return <Alert tone="info" title={p('linkedLocation')}>
    <p>{p('linkedLocationDescription')} {catalog.linkSite === 'all' ? p('allLocations') : site ? <span lang="es">{site.nombre}</span> : p(status === 'loading' ? 'locationsLoading' : 'linkedLocationUnavailable')}</p>
    <div className="mt-3 flex flex-wrap gap-3"><Button variant="secondary" disabled={!canApply} onClick={catalog.applyLinkSite}>{p('applyLinkedLocation')}</Button><Button variant="ghost" onClick={catalog.useCurrentSite}>{p('keepCurrentLocation')}</Button></div>
  </Alert>;
}

export function CatalogPagination({ catalog, page, totalPages }: { catalog: CatalogUrl; page: number; totalPages: number }) {
  const { p } = usePublicInterface();
  return totalPages > 1 ? <Pagination page={page} totalPages={totalPages} onChange={catalog.setPage} labels={{ page: p('page'), of: p('of'), previous: p('previousPage'), next: p('nextPage') }} /> : null;
}
