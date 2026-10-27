import React from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { usePublicPreferences } from './PublicPreferences';
export const SiteSelector: React.FC<{ showCity?: boolean; label?: string; id?: string; className?: string; labelClassName?: string }> = ({ showCity = false, label, id, className, labelClassName }) => {
  const { selected, choose, sites, status, retry } = usePublicPreferences();
  const { t, locale } = useLocale();
  const missingOption = typeof selected === 'number' && !sites.some((s) => s.id === selected);
  return <div lang={locale} className="min-w-0 text-xs">
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1"><span className={labelClassName ?? 'text-xs font-semibold text-neutro-700'}>{label ?? t('site')}</span>
      <select id={id} value={selected} aria-busy={status === 'loading'} className={className ?? 'min-h-11 w-full min-w-0 max-w-full rounded-md border bg-white px-3 text-sm text-neutro-900'}
        onChange={(e) => choose(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
        {missingOption && <option value={selected} disabled>{t(status === 'loading' ? 'loadingSite' : status === 'error' ? 'siteError' : 'unavailableSite')}</option>}
        <option value="all">{t('allSites')}</option>
        {sites.map((s) => <option key={s.id} value={s.id} lang="es">{s.nombre}{showCity && s.ciudad ? ` — ${s.ciudad}` : ''}</option>)}
      </select>
    </label>
    {status !== 'ready' && <p role="status" className="mt-1 max-w-xs text-xs text-neutro-600">
      {t(status === 'loading' ? 'loading' : status === 'error' ? 'siteError' : status === 'empty' ? 'emptySites' : 'unavailableSite')}
      {status === 'error' && <button type="button" onClick={retry} className="ml-2 min-h-11 underline">{t('retry')}</button>}
    </p>}
  </div>;
};
