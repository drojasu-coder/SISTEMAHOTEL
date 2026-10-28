import { CurrencySelector } from '@/features/preferencias/CurrencySelector';
import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { LanguageSelector, useLocale } from '@/i18n/LocaleContext';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
export const PublicTopBar: React.FC = () => {
  const { selected, sites, status, selectionOpen, openSelection } = usePublicPreferences();
  const { t, locale } = useLocale();
  const site = sites.find((s) => s.id === selected);
  const label = selected === 'all' ? t('allSites') : site?.short ?? t(status === 'loading' ? 'loadingSite' : status === 'error' ? 'siteError' : 'unavailableSite');
  return <div lang={locale} data-testid="public-top-bar" className="border-b border-bronce-200 bg-bronce-50 text-neutro-800">
    <div className="mx-auto flex min-h-11 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
      <button type="button" aria-label={`${t('site')}: ${label}`} aria-haspopup="dialog" aria-expanded={selectionOpen} onClick={(event) => openSelection(event.currentTarget)} className="flex min-h-11 min-w-0 items-center gap-2 rounded-md text-xs font-medium">
        <MapPin className="size-4 shrink-0 text-bronce-700" aria-hidden="true" /><span className="truncate" lang={site ? 'es' : locale}>{label}</span><ChevronDown className="size-3 shrink-0" aria-hidden="true" />
      </button>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2"><CurrencySelector /><LanguageSelector compact /></div>
    </div>
  </div>;
};
