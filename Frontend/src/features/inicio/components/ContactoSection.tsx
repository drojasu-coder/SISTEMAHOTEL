import { usePublicInterface } from '@/i18n/public';
import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import type { InicioData } from '../types';

interface ContactoSectionProps {
  data: InicioData;
}

export const ContactoSection: React.FC<ContactoSectionProps> = ({ data }) => {
  const { p } = usePublicInterface();
  if (!data.contacto_visible) return null;

  return (
    <section
      aria-label={p('contactInformation')}
      className="border-t border-neutro-200 bg-neutro-100/50 py-16 sm:py-24"
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

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          {/* Teléfono */}
          <div className="flex flex-col items-center rounded-2xl border border-neutro-200 bg-white p-6 text-center shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-full bg-bronce-50 text-bronce-700">
              <Phone className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-serif text-base font-bold text-neutro-900">
              {' '}{p('directPhone')}{' '}</h3>
            <p className="mt-1 text-xs text-neutro-500">
              {' '}{p('centralReception')}{' '}</p>
            <a
              href={`tel:${data.contacto_telefono.replace(/[^+\d]/g, '')}`}
              className="mt-3 text-sm font-semibold text-bronce-700 hover:underline"
            >
              {data.contacto_telefono}
            </a>
          </div>

          {/* Correo Electrónico */}
          <div className="flex flex-col items-center rounded-2xl border border-neutro-200 bg-white p-6 text-center shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-full bg-bronce-50 text-bronce-700">
              <Mail className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-serif text-base font-bold text-neutro-900">
              {' '}{p('email')}{' '}</h3>
            <p className="mt-1 text-xs text-neutro-500">
              {' '}{p('enquiries')}{' '}</p>
            <a
              href={`mailto:${data.contacto_email}`}
              className="mt-3 text-sm font-semibold text-bronce-700 hover:underline"
            >
              {data.contacto_email}
            </a>
          </div>

          {/* Ubicación Central */}
          <div className="flex flex-col items-center rounded-2xl border border-neutro-200 bg-white p-6 text-center shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-full bg-bronce-50 text-bronce-700">
              <MapPin className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-serif text-base font-bold text-neutro-900">
              {' '}{p('location')}{' '}</h3>
            <p className="mt-1 text-xs text-neutro-500">
              {' '}{p('centralOffices')}{' '}</p>
            <span className="mt-3 text-sm font-semibold text-neutro-800">
              {data.contacto_direccion}
            </span>
          </div>
        </div>

        {/* Banner de llamada a la acción */}
        <div className="mt-12 rounded-2xl bg-neutro-900 px-6 py-8 sm:px-12 sm:py-10 text-center max-w-4xl mx-auto shadow-xl">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
            {' '}{p('readyTitle')}{' '}</h3>
          <p className="mt-2 text-sm text-neutro-300 max-w-xl mx-auto">
            {' '}{p('readyDescription')}{' '}</p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/crear-reserva"
              className={buttonStyles({
                variant: 'primary',
                size: 'lg',
                className: 'font-semibold shadow-md',
              })}
            >
              <Calendar className="size-4 mr-2" aria-hidden="true" />
              <span>{p('startReservation')}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
