import React from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@/components/ui/Modal';
import { useLocale } from '@/i18n/LocaleContext';
import { usePublicPreferences } from './PublicPreferences';
export const SitePicker: React.FC = () => {
  const { selectionOpen, closeSelection, selected, sites, status, retry, choose } = usePublicPreferences();
  const { locale, t } = useLocale();
  if (!selectionOpen) return null;
  return createPortal(<div lang={locale}><Modal open title={t('chooseSite')} closeLabel={t('close')} onClose={closeSelection}>
    <div className="flex flex-col gap-2">
      <button type="button" aria-pressed={selected === 'all'} className="min-h-11 rounded-md border p-3 text-left hover:bg-bronce-50" onClick={() => { choose('all'); closeSelection(); }}>{t('allSites')}</button>
      {sites.map((site) => <button key={site.id} type="button" aria-pressed={selected === site.id} className="min-h-11 rounded-md border p-3 text-left hover:bg-bronce-50" onClick={() => { choose(site.id); closeSelection(); }}>
        <span lang="es" className="block font-semibold">{site.nombre}</span><span lang="es" className="text-xs text-neutro-600">{site.ciudad}</span>
      </button>)}
      {status !== 'ready' && <p role="status">{t(status === 'error' ? 'siteError' : status === 'loading' ? 'loading' : status === 'empty' ? 'emptySites' : 'unavailableSite')}</p>}
      {status === 'error' && <button type="button" onClick={retry} className="min-h-11 underline">{t('retry')}</button>}
    </div>
  </Modal></div>, document.body);
};
