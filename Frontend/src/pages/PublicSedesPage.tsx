import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { ServiceMedia } from '@/components/shared/ServiceCard';
import { buttonStyles } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useLocale } from '@/i18n/LocaleContext';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { publicContactPhone } from '@/lib/contact';
import { cn } from '@/lib/cn';

const copy = {
  intro: ['Cuatro destinos de Guatemala con la misma hospitalidad. Elija una sede para ver su oferta.', 'Four destinations in Guatemala with the same hospitality. Choose a location to see what it offers.'],
  current: ['Sede actual', 'Current location'],
  rooms: ['Ver habitaciones', 'View rooms'],
  reserve: ['Reservar', 'Book'],
  error: ['No se pudieron cargar las sedes.', 'The locations could not be loaded.'],
  retry: ['Reintentar', 'Retry'],
} as const;

/** Todas las sedes, siempre: esta página sirve precisamente para elegir o cambiar de sede. */
export const PublicSedesPage: React.FC = () => {
  const { t, locale } = useLocale();
  const { sites, choose, selected, status, retry } = usePublicPreferences();
  const text = (key: keyof typeof copy) => copy[key][locale === 'en' ? 1 : 0];
  return <PageContainer lang={locale}>
    <PageHeader title={t('sites')} description={text('intro')} />
    {status === 'loading' && <LoadingNotice />}
    {status === 'error' && <Alert tone="error" title={text('error')}><button type="button" className={buttonStyles({ variant: 'ghost', size: 'sm' })} onClick={retry}>{text('retry')}</button></Alert>}
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{sites.map((s) => {
      const actual = selected === s.id;
      const phone = publicContactPhone(s.telefono);
      return <article key={s.id} className={cn('flex flex-col overflow-hidden rounded-xl border bg-white', actual ? 'border-bronce-500 ring-1 ring-bronce-500' : 'border-neutro-200')}>
        <ServiceMedia src={s.imagen_url} alt={s.nombre} credits={s.imagen_creditos} />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="space-y-1">
            {actual && <Badge tone="info">{text('current')}</Badge>}
            <h2 lang="es" className="font-serif text-xl font-semibold text-neutro-900">{s.nombre}</h2>
          </div>
          <div className="space-y-1.5 text-sm text-neutro-600">
            {(s.ciudad || s.direccion) && <p className="flex gap-2" lang="es"><MapPin className="mt-0.5 size-4 shrink-0 text-bronce-700" aria-hidden="true" /><span>{[s.direccion, s.ciudad].filter(Boolean).join(', ')}</span></p>}
            {phone && <p className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0 text-bronce-700" aria-hidden="true" /><a className="underline" href={phone.href}>{phone.display}</a></p>}
          </div>
          <div className="mt-auto flex flex-col gap-2 pt-2">
            <Link to="/habitaciones" onClick={() => choose(s.id)} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'justify-center' })}>{text('rooms')}</Link>
            <Link to="/reservar" onClick={() => choose(s.id)} className={buttonStyles({ variant: 'primary', size: 'sm', className: 'justify-center' })} aria-label={`${text('reserve')} · ${s.nombre}`}>{text('reserve')}</Link>
          </div>
        </div>
      </article>;
    })}</div>
  </PageContainer>;
};
