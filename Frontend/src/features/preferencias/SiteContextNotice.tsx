import React, { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { usePublicPreferences } from './PublicPreferences';
export const CatalogSiteNotice: React.FC = () => {
  const { selected, sites, status, openSelection, selectionOpen } = usePublicPreferences();
  const { t, locale } = useLocale();
  const initial = useRef(selected);
  const [changed, setChanged] = useState(false);
  useEffect(() => { if (initial.current !== selected) setChanged(true); }, [selected]);
  return <div lang={locale} className="space-y-2 text-sm">
    <p>{t('showing')} <span lang={selected !== 'all' && sites.some((s) => s.id === selected) ? 'es' : locale}>{selected === 'all' ? t('allSites') : sites.find((s) => s.id === selected)?.nombre ?? t(status === 'loading' ? 'loadingSite' : status === 'error' ? 'siteError' : 'unavailableSite')}</span> · <button type="button" className="min-h-11 underline" aria-expanded={selectionOpen} aria-haspopup="dialog" onClick={(event) => openSelection(event.currentTarget)}>{t('changeSite')}</button></p>
    {changed && <p role="status" className="rounded-md border border-bronce-200 bg-bronce-50 p-3 text-xs">{t('changed')}</p>}
  </div>;
};
/** El borrador sigue montado; una sede incompatible impide enviarlo. */
export function useDraftSiteGuard(resourceId?: number | null, resourceSite?: number | null) {
  const { selected, status } = usePublicPreferences();
  const origin = useRef({ resourceId, selected });
  if (origin.current.resourceId !== resourceId) origin.current = { resourceId, selected };
  return Boolean(resourceId && ((selected !== origin.current.selected && selected !== 'all' && selected !== resourceSite) || (selected === resourceSite && status === 'unavailable')));
}
export const DraftSiteNotice: React.FC<{ blocked: boolean }> = ({ blocked }) => {
  const { t, locale } = useLocale();
  return blocked ? <p lang={locale} role="alert" className="rounded-md bg-bronce-50 p-3 text-sm">{t('changed')}</p> : null;
};
export const ResourceSiteNotice: React.FC<{ siteId?: number | null; name?: string }> = ({ siteId, name }) => {
  const { selected, choose, sites } = usePublicPreferences();
  const { t, locale } = useLocale();
  if (!siteId || selected === siteId) return null;
  const site = sites.find((s) => s.id === siteId);
  return <aside lang={locale} className="rounded-md border bg-bronce-50 p-3 text-sm">
    <p>{t('resourceSite')} <span lang="es">{site?.nombre || name}</span>.</p>
    {site && <button type="button" className="min-h-11 underline" onClick={() => choose(siteId)}>{t('exploreSite')}</button>}
  </aside>;
};
