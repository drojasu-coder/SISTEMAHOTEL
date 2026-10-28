import React, { createContext, useContext, useEffect, useState } from 'react';
import { initialCurrency, CURRENCY_KEY, initialLanguage, LANGUAGE_KEY, readPreference, writePreference } from '@/features/preferencias/storage';
import { translateUx, type UxKey } from './ux';
import type { DisplayCurrency } from '@/lib/money';
type Locale = 'es' | 'en';
const LocaleContext = createContext({ currency: 'GTQ' as DisplayCurrency, setCurrency: (_currency: DisplayCurrency) => {}, locale: 'es' as Locale, setLocale: (_locale: Locale) => {}, t: (key: UxKey) => translateUx('es', key) });
export const LocaleProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [currency, updateCurrency] = useState<DisplayCurrency>(() => initialCurrency(readPreference(CURRENCY_KEY)));
  const setCurrency = (value: DisplayCurrency) => {
    if (value !== 'GTQ' && value !== 'USD') return;
    updateCurrency(value); writePreference(CURRENCY_KEY, value);
  };
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === CURRENCY_KEY || event.key === null) updateCurrency(initialCurrency(readPreference(CURRENCY_KEY))); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const [locale, update] = useState<Locale>(() => initialLanguage(readPreference(LANGUAGE_KEY), navigator.language));
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const setLocale = (value: Locale) => { update(value); writePreference(LANGUAGE_KEY, value); };
  return <LocaleContext.Provider value={{ currency, setCurrency, locale, setLocale, t: (key) => translateUx(locale, key) }}>{children}</LocaleContext.Provider>;
};
export const useLocale = () => useContext(LocaleContext);
export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { locale, setLocale, t } = useLocale();
  return <label lang={locale} className="flex min-w-0 flex-col gap-1 text-xs"><span className={compact ? 'sr-only' : undefined}>{t('language')}</span>
    <select aria-label={t('language')} className={`min-h-11 rounded-md px-2 text-neutro-900 ${compact ? 'border-transparent bg-transparent font-semibold' : 'border bg-white'}`} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
      <option value="es" lang="es">{compact ? 'ES' : 'Español'}</option><option value="en" lang="en">{compact ? 'EN' : 'English'}</option>
    </select></label>;
};
