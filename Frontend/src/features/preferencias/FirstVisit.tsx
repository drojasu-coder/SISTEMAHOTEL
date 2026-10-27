import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { LanguageSelector, useLocale } from '@/i18n/LocaleContext';
import { usePublicPreferences } from './PublicPreferences';
import { SiteSelector } from './SiteSelector';
/** Invitación no modal: no compite por foco con login, pago ni formularios. */
export const FirstVisit: React.FC = () => {
  const { pathname } = useLocation();
  const { hasPreference, choose, sites } = usePublicPreferences();
  const { locale, t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  if (hasPreference) return null;
  const home = pathname === '/';
  return <aside lang={locale} className="border-b bg-bronce-50 px-4 py-4" aria-label={t('chooseSite')}>
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm font-semibold">{t(home ? 'welcome' : 'invitation')}</p>
        <div className="flex flex-wrap items-center gap-3">
          {!home && <button type="button" className="min-h-11 underline" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{t('chooseSite')}</button>}
          <button type="button" className="min-h-11 underline" onClick={() => choose('all')}>{t('allSitesAction')}</button>
          <button type="button" className="min-h-11 px-2" onClick={() => choose('all')} aria-label={t('close')}>×</button>
        </div>
      </div>
      {(home || expanded) && <>
        <div className="grid gap-3 sm:grid-cols-2"><SiteSelector /><LanguageSelector /></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sites.map((site) => <button type="button" key={site.id} onClick={() => choose(site.id)} className="overflow-hidden rounded-lg border bg-white text-left hover:border-bronce-600">
            {site.imagen_url ? <img src={site.imagen_url} alt={site.nombre} className="h-24 w-full object-cover" /> : <span className="flex h-24 items-center justify-center bg-neutro-100"><Building2 aria-hidden="true" /></span>}
            <span lang="es" className="block p-3 text-xs"><strong className="block">{site.nombre}</strong>{site.ciudad}</span>
          </button>)}
        </div>
        {sites.filter((s) => s.imagen_url && s.imagen_creditos).map((s) => <p key={s.id} className="text-xs">
          {t('photoCredit')}: {s.imagen_creditos.url ? <a className="underline" href={s.imagen_creditos.url} target="_blank" rel="noreferrer">{s.imagen_creditos.texto || s.imagen_creditos.autor} {s.imagen_creditos.licencia}</a> : s.imagen_creditos.texto || s.imagen_creditos.autor}
        </p>)}
      </>}
    </div>
  </aside>;
};
