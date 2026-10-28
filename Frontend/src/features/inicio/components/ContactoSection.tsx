import { usePublicInterface } from '@/i18n/public';
import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import type { InicioData } from '../types';
import { Link } from 'react-router-dom';
import { publicContactPhone, publicContactEmail, publicContactAddress } from '@/lib/contact';

interface ContactoSectionProps {
  data: InicioData;
}

export const ContactoSection: React.FC<ContactoSectionProps> = ({ data }) => {
  const { p, locale } = usePublicInterface();
  if (!data.contacto_visible) return null;
  const phone = publicContactPhone(data.contacto_telefono);
  const email = publicContactEmail(data.contacto_email);
  const address = publicContactAddress(data.contacto_direccion);
  const count = Number(Boolean(phone)) + Number(Boolean(email)) + Number(Boolean(address));

  return (
    <section
      id="contacto"
      tabIndex={-1}
      aria-label={p('contactInformation')}
      className="scroll-mt-24 border-t border-neutro-200 bg-neutro-100/50 py-16 focus:outline-none sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-bronce-700">
            {' '}{p('guestService')}{' '}</p>
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-neutro-900 sm:text-4xl">
            <span lang="es">{data.contacto_titulo}</span>
          </h2>
          <p className="mt-3 text-base text-neutro-600 sm:text-lg">
            <span lang="es">{data.contacto_texto}</span>
          </p>
        </div>

        {count > 0 ? <div className={`mt-12 grid grid-cols-1 gap-6 ${count === 3 ? 'sm:grid-cols-3' : count === 2 ? 'sm:grid-cols-2' : ''} max-w-4xl mx-auto`}>
          {/* Teléfono */}
          {phone && <div className="flex flex-col items-center rounded-2xl border border-neutro-200 bg-white p-6 text-center shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-full bg-bronce-50 text-bronce-700">
              <Phone className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-serif text-base font-bold text-neutro-900">
              {' '}{p('directPhone')}{' '}</h3>
            <p className="mt-1 text-xs text-neutro-500">
              {' '}{p('centralReception')}{' '}</p>
            <a
              href={phone.href}
              className="mt-3 inline-flex min-h-11 items-center break-words text-sm font-semibold text-bronce-700 hover:underline"
            >
              {phone.display}
            </a>
          </div>}

          {/* Correo Electrónico */}
          {email && <div className="flex flex-col items-center rounded-2xl border border-neutro-200 bg-white p-6 text-center shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-full bg-bronce-50 text-bronce-700">
              <Mail className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-serif text-base font-bold text-neutro-900">
              {' '}{p('email')}{' '}</h3>
            <p className="mt-1 text-xs text-neutro-500">
              {' '}{p('enquiries')}{' '}</p>
            <a
              href={`mailto:${email}`}
              className="mt-3 inline-flex min-h-11 items-center break-all text-sm font-semibold text-bronce-700 hover:underline"
            >
              {email}
            </a>
          </div>}

          {/* Ubicación Central */}
          {address && <div className="flex flex-col items-center rounded-2xl border border-neutro-200 bg-white p-6 text-center shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-full bg-bronce-50 text-bronce-700">
              <MapPin className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-serif text-base font-bold text-neutro-900">
              {' '}{p('location')}{' '}</h3>
            <span className="mt-3 text-sm font-semibold text-neutro-800">
              <span lang="es">{address}</span>
            </span>
          </div>}
        </div> : <div className="mx-auto mt-8 max-w-xl text-center">
          <p className="text-sm text-neutro-600">{locale === 'en' ? 'Find the information for each location and choose where to visit us.' : 'Encuentre la información de cada ubicación y elija la sede de su visita.'}</p>
          <Link to="/sedes" className="mt-3 inline-flex min-h-11 items-center font-semibold text-bronce-700 underline">{locale === 'en' ? 'View locations and contact details' : 'Consultar sedes y contacto'}</Link>
        </div>}

      </div>
    </section>
  );
};
