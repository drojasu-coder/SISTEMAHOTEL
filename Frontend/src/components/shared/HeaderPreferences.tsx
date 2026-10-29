import { Popover } from '@/components/ui/Popover';
import { Icon } from '@/components/ui/Icon';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { useLocale } from '@/i18n/LocaleContext';
export function HeaderSitePicker({ compact = false }: { compact?: boolean }) {
  const { selected, choose, sites, status, retry } = usePublicPreferences();
  const { t } = useLocale();
  const site = sites.find(s => s.id === selected);
  const label = selected === 'all' ? t('allSites') : site?.short ?? t(status === 'loading' ? 'loadingSite' : 'unavailableSite');
  return <Popover label={`${t('site')}: ${label}`} role="dialog" className="header-site" triggerClassName={compact ? 'header-site-compact w-full text-bronce-800' : 'w-full border border-bronce-200 bg-white text-bronce-800'} trigger={<><Icon name="ubicacion" className="size-4" /><span className="truncate">{label}</span></>}>
    {close => <>
      <div role="listbox" aria-label={t('site')}>
      <button role="option" aria-selected={selected === 'all'} className="header-option" onClick={() => { choose('all'); close(); }}><span className="flex-1">{t('allSites')}</span>{selected === 'all' && <Icon name="check" />}</button>
      {sites.map(s => <button key={s.id} role="option" aria-selected={selected === s.id} className="header-option" onClick={() => { choose(s.id); close(); }}><span className="min-w-0 flex-1 text-left"><span className="block font-medium">{s.nombre}</span><span className="block text-xs text-neutro-600">{s.ciudad}</span></span>{selected === s.id && <Icon name="check" />}</button>)}
      </div>
      {status !== 'ready' && <div role="presentation" className="px-3 py-2 text-xs text-neutro-600"><p role="status">{t(status === 'loading' ? 'loading' : status === 'error' ? 'siteError' : status === 'empty' ? 'emptySites' : 'unavailableSite')}</p>{status === 'error' && <button className="header-control" onClick={retry}>{t('retry')}</button>}</div>}
    </>}
  </Popover>;
}
export function HeaderPreferences({ iconOnly = false }: { iconOnly?: boolean }) {
  const { locale, currency, setLocale, setCurrency, t } = useLocale();
  return <Popover role="dialog" label={t('languageCurrency')} title={t('languageCurrency')} showChevron={!iconOnly} triggerClassName={iconOnly ? 'justify-center !px-3' : 'w-full border border-bronce-200 bg-white text-bronce-800'} trigger={<><Icon name="globo" />{!iconOnly && <span>{locale.toUpperCase()} · {currency}</span>}</>}>
    <p className="px-2 pb-4 font-semibold">{t('preferences')}</p>
    <fieldset className="p-2"><legend className="text-xs font-semibold text-neutro-600">{t('language')}</legend><div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-neutro-100 p-1">{(['es', 'en'] as const).map(value => <button key={value} aria-pressed={locale === value} onClick={() => setLocale(value)} className={`header-control justify-center ${locale === value ? 'bg-white text-bronce-800 shadow-soft' : ''}`}>{t(value === 'es' ? 'spanish' : 'english')}</button>)}</div></fieldset>
    <fieldset className="mt-3 border-t border-neutro-200 p-2"><legend className="text-xs font-semibold text-neutro-600">{t('currency')}</legend>{(['GTQ', 'USD'] as const).map(value => <button key={value} aria-pressed={currency === value} className="header-option" onClick={() => setCurrency(value)}><span className="flex-1 text-left">{t(value === 'GTQ' ? 'quetzales' : 'dollars')}</span>{currency === value && <Icon name="check" />}</button>)}</fieldset>
    <p className="px-2 text-xs leading-relaxed text-neutro-600">{t('displayCurrencyHint')}</p>
  </Popover>;
}
