import React from 'react';
import { useLocale } from '@/i18n/LocaleContext';

export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency, t } = useLocale();
  return <label className="flex min-w-0 flex-col gap-1 text-xs">
    <span className="sr-only">{t('currency')}</span>
    <select aria-label={t('currency')} className="min-h-11 rounded-md border border-transparent bg-transparent px-2 font-semibold text-neutro-900 focus-visible:border-bronce-600" value={currency} onChange={event => {
      if (event.target.value === 'GTQ' || event.target.value === 'USD') setCurrency(event.target.value);
    }}>
      <option value="GTQ">GTQ (Q)</option><option value="USD">USD (US$)</option>
    </select>
  </label>;
};
