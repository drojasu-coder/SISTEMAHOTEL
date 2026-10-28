import React from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '@/components/shared/Brand';
import { useLocale } from '@/i18n/LocaleContext';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { useInicioQuery } from '@/features/inicio/hooks/useInicio';
import { publicContactPhone, publicContactEmail } from '@/lib/contact';
import { MONEY_PRESENTATION } from '@/lib/money';
import { experienceLinks } from './publicNavigation';
import { LegalLinks } from '@/features/legal';

export const Footer: React.FC = () => {
  const { t, locale } = useLocale();
  const { sites, choose } = usePublicPreferences();
  const { data: inicio } = useInicioQuery();
  const email = publicContactEmail(inicio?.contacto_email);
  return <footer lang={locale} className="mt-auto border-t border-neutro-800 bg-neutro-900 text-neutro-300">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr_1fr]">
        <div className="space-y-4"><Brand inverse />{inicio?.contacto_visible && <div className="flex flex-col items-start gap-1"><Link className="inline-flex min-h-11 items-center text-sm underline" to="/#contacto">{locale === 'en' ? 'Contact' : 'Contacto'}</Link>{email && <a className="inline-flex min-h-11 items-center break-all text-sm underline" href={`mailto:${email}`}>{email}</a>}</div>}<p className="text-xs leading-relaxed">{t('footerDescription')}</p></div>
        <div><h2 className="!text-sm text-bronce-300">{t('sites')}</h2><ul className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
          {sites.map((site) => { const phone = publicContactPhone(site.telefono); return <li key={site.id} className="space-y-1">
            <Link lang="es" to="/sedes" onClick={() => choose(site.id)} className="font-semibold hover:text-white">{site.nombre}</Link>
            <p lang="es" className="text-neutro-300">{site.ciudad}</p>
            {phone && <a className="inline-flex min-h-11 items-center underline" href={phone.href}>{phone.display}</a>}
          </li>; })}
        </ul></div>
        <div><h2 className="!text-sm text-bronce-300">{t('experiences')}</h2><ul className="mt-3 space-y-2 text-xs">
          {[{ to: '/restaurante', label: 'restaurant' as const }, ...experienceLinks].map((link) => <li key={link.to}><Link to={link.to} className="inline-flex min-h-11 items-center hover:text-white">{t(link.label)}</Link></li>)}
        </ul></div>

      </div>
      <div className="mt-8 space-y-3 border-t border-neutro-800 pt-6 text-xs">
        <LegalLinks linkClassName="inline-flex min-h-11 items-center underline hover:text-white" />
        <p>© {new Date().getFullYear()} Hotel Hunahpú</p>
        <p>{t('finalPricesPolicy')}</p>
        <p>{t('currencyNote').replace('{rate}', MONEY_PRESENTATION.gtqPerUsd.toFixed(2))}</p>
      </div>
    </div>
  </footer>;
};
