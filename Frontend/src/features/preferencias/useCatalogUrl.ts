import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { usePublicPreferences } from './PublicPreferences';
import { parseSite } from './storage';

const PAGE_SIZE = 9;
const text = (value: string | null) => (value ?? '').slice(0, 160);
/** Los endpoints actuales entregan colecciones completas. La página es solo presentación local. */
export function useCatalogUrl(options: Record<string, readonly string[] | undefined> = {}, siteDependent = true, legacySiteParam?: string) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const scope = usePublicPreferences();
  const previousSite = useRef(scope.selected);
  const latest = useRef(params);
  latest.current = params;
  const rawPage = params.get('page');
  const parsedPage = rawPage && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 10000) : 1;
  const q = text(params.get('q'));
  const values: Record<string, string> = {};
  for (const [key, allowed] of Object.entries(options)) {
    const value = text(params.get(key));
    values[key] = !value || !allowed || allowed.includes(value) ? value : '';
  }
  const linkSite = siteDependent ? parseSite(params.get('sede') ?? (legacySiteParam ? params.get(legacySiteParam) : null)) : null;
  const siteConflict = linkSite !== null && linkSite !== scope.selected;
  function update(changes: Record<string, string | number | null>, replace = false) {
    const next = new URLSearchParams(latest.current);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '' || (key === 'page' && value === 1)) next.delete(key);
      else next.set(key, String(value));
    }
    if (siteDependent && !siteConflict) next.set('sede', String(scope.selected));
    latest.current = next;
    navigate({ search: next.toString(), hash: location.hash }, { replace, preventScrollReset: true });
  }
  // Canonicaliza solo parámetros propios; preserva parámetros ajenos y el historial.
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (rawPage && (page === 1 || String(page) !== rawPage)) page === 1 ? next.delete('page') : next.set('page', String(page));
    if (params.has('q') && (!q || params.get('q') !== q)) q ? next.set('q', q) : next.delete('q');
    if (siteDependent && params.has('sede') && linkSite === null) next.delete('sede');
    for (const key of Object.keys(options)) {
      if (params.has(key) && params.get(key) !== values[key]) values[key] ? next.set(key, values[key]) : next.delete(key);
    }
    if (siteDependent && previousSite.current !== scope.selected) {
      previousSite.current = scope.selected;
      next.set('sede', String(scope.selected)); next.delete('page');
    }
    if (next.toString() !== params.toString()) { latest.current = next; navigate({ search: next.toString(), hash: location.hash }, { replace: true, preventScrollReset: true }); }
  });
  const share = new URLSearchParams(params);
  if (siteDependent && !siteConflict) share.set('sede', String(scope.selected));
  const clear = () => update(Object.fromEntries(['q', 'page', ...Object.keys(options)].map((key) => [key, null])));
  return {
    q, values, page, pageSize: PAGE_SIZE, siteConflict, linkSite,
    setSearch: (value: string) => update({ q: text(value), page: null }, true),
    setFilter: (key: string, value: string) => update({ [key]: value, page: null }),
    updateParams: update,
    setPage: (value: number, replace = false) => update({ page: value }, replace),
    clear,
    applyLinkSite: () => { if (linkSite !== null) { previousSite.current = linkSite; scope.choose(linkSite); } },
    useCurrentSite: () => update({ sede: String(scope.selected), page: null }, true),
    shareHref: `${location.pathname}${share.size ? `?${share}` : ''}${location.hash}`,
  };
}
export type CatalogUrl = ReturnType<typeof useCatalogUrl>;

/** Corrige páginas fuera de rango solo cuando terminó la consulta, sin falsear el total. */
export function useCatalogPage<T>(items: T[], catalog: CatalogUrl, settled: boolean) {
  const totalPages = Math.ceil(items.length / catalog.pageSize);
  const page = Math.min(catalog.page, Math.max(1, totalPages));
  useEffect(() => { if (settled && !catalog.siteConflict && page !== catalog.page) catalog.setPage(page, true); }, [settled, page, catalog.page, catalog.siteConflict]);
  return { items: items.slice((page - 1) * catalog.pageSize, page * catalog.pageSize), page, totalPages };
}
