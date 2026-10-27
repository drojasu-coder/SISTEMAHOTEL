import React, { createContext, useContext, useRef, useState } from 'react';
import { SitePicker } from './SitePicker';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { orderedSites } from './sitePresentation';
import { parseSite, readPreference, SITE_KEY, writePreference, type PublicSite } from './storage';
export type SiteStatus = 'loading' | 'error' | 'empty' | 'unavailable' | 'ready';
export function siteStatus(selected: PublicSite, sites: { id: number }[], loading: boolean, error: boolean): SiteStatus {
  if (loading) return 'loading';
  if (error) return 'error';
  if (typeof selected === 'number' && !sites.some((s) => s.id === selected)) return 'unavailable';
  return sites.length ? 'ready' : 'empty';
}
type PublicPreferencesValue = {
  selectionOpen: boolean;
  openSelection: (trigger: HTMLElement) => void;
  closeSelection: () => void;
  managed: boolean;
  selected: PublicSite; choose: (site: PublicSite) => void; hasPreference: boolean;
  sites: ReturnType<typeof orderedSites>; status: SiteStatus; retry: () => void;
};
const PublicContext = createContext<PublicPreferencesValue>({ selectionOpen: false, openSelection: () => {}, closeSelection: () => {}, managed: false, selected: 'all', choose: () => {}, hasPreference: true, sites: [], status: 'ready', retry: () => {} });
export const PublicPreferencesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [initial] = useState(() => parseSite(readPreference(SITE_KEY)));
  const [selected, update] = useState<PublicSite>(initial ?? 'all');
  const [hasPreference, setHasPreference] = useState(initial !== null);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const selectionTrigger = useRef<HTMLElement | null>(null);
  const openSelection = (trigger: HTMLElement) => {
    if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
    selectionTrigger.current = trigger;
    setSelectionOpen(true);
  };
  const closeSelection = () => { setSelectionOpen(false); selectionTrigger.current?.focus({ preventScroll: true }); };
  const catalog = useSedesQuery();
  const sites = orderedSites(Array.isArray(catalog.data) ? catalog.data : []);
  const choose = (site: PublicSite) => { update(site); setHasPreference(true); writePreference(SITE_KEY, String(site)); };
  return <PublicContext.Provider value={{ selectionOpen, openSelection, closeSelection, managed: true, selected, choose, hasPreference, sites,
    status: siteStatus(selected, sites, catalog.isPending, catalog.isError), retry: () => { void catalog.refetch(); } }}>{children}<SitePicker /></PublicContext.Provider>;
};
export const usePublicPreferences = () => useContext(PublicContext);
