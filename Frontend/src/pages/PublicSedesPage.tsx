import React from 'react';
import { Link } from 'react-router-dom';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { ServiceMedia } from '@/components/shared/ServiceCard';
import { buttonStyles } from '@/components/ui/Button';
import { useLocale } from '@/i18n/LocaleContext';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { CatalogSiteNotice } from '@/features/preferencias/SiteContextNotice';
import { publicPhone } from '@/lib/contact';
export const PublicSedesPage: React.FC = () => {
  const { t, locale } = useLocale();
  const { sites, choose, selected } = usePublicPreferences();
  return <PageContainer lang={locale}>
    <PageHeader title={t('sites')} context={<CatalogSiteNotice />} />
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{sites.filter((s) => selected === 'all' || s.id === selected).map((s) => <article key={s.id} className="overflow-hidden rounded-xl border bg-white">
      <ServiceMedia src={s.imagen_url} alt={s.nombre} credits={s.imagen_creditos} />
      <div className="space-y-3 p-4"><h2 lang="es" className="!text-lg">{s.nombre}</h2><p lang="es">{s.ciudad}</p>
        {s.telefono && <a className="block min-h-11 underline" href={publicPhone(s.telefono).href}>{publicPhone(s.telefono).display}</a>}
        <Link to="/reservar" onClick={() => choose(s.id)} className={buttonStyles({ variant: 'secondary', size: 'sm' })}>{t('reserveSite')}</Link>
      </div>
    </article>)}</div>
  </PageContainer>;
};
