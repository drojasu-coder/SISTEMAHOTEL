import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Sparkles, ShieldCheck, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useSalonQuery } from '../hooks/useEventos';
import { ReservaEventoModal } from './ReservaEventoModal';
import { textosEventos, formatearGTQ } from '../textos';
import { getApiErrorMessage } from '@/api/errors';

interface SalonDetalleCardProps {
  id: number;
}

export const SalonDetalleCard: React.FC<SalonDetalleCardProps> = ({ id }) => {
  const navigate = useNavigate();
  const salonQuery = useSalonQuery(id);
  const [modalAbierto, setModalAbierto] = useState(false);

  const salon = salonQuery.data;

  if (salonQuery.isPending) {
    return (
      <div className="flex justify-center py-20">
        <LoadingNotice label="Cargando detalles del salón..." />
      </div>
    );
  }

  if (salonQuery.isError || !salon) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Link
          to="/eventos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-bronce-700 transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{textosEventos.volverAlCatalogo}</span>
        </Link>
        <Card className="p-8">
          <Alert tone="error" title="No se encontró el salón">
            {salonQuery.error ? getApiErrorMessage(salonQuery.error) : 'El salón solicitado no existe o no se encuentra disponible.'}
          </Alert>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate('/eventos')}>
              {textosEventos.volverAlCatalogo}
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Botón de retorno */}
      <Link
        to="/eventos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-bronce-700 transition-colors w-fit"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>{textosEventos.volverAlCatalogo}</span>
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Columna Principal */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div>
            {salon.sucursal?.nombre && (
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-selva-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-selva-700">
                <MapPin className="size-3.5" aria-hidden="true" />
                {salon.sucursal.nombre}
              </span>
            )}
            <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-bold">
              {salon.nombre}
            </h1>
          </div>

          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-neutro-900 mb-3">
              Descripción del espacio
            </h2>
            <p className="text-sm text-neutro-700 leading-relaxed whitespace-pre-line">
              {salon.descripcion ||
                'Salón finamente acondicionado para celebraciones sociales y corporativas. Cuenta con acústica de alta fidelidad, climatización centralizada e iluminación graduable.'}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-neutro-900 mb-4">
              {textosEventos.caracteristicasSalon}
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div className="flex items-start gap-3 rounded-lg bg-neutro-50 p-4 border border-neutro-100">
                <Users className="size-5 text-selva-600 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-neutro-500 font-medium">{textosEventos.capacidadMaximaLabel}</dt>
                  <dd className="text-base font-bold text-neutro-900">{salon.capacidad_maxima} invitados</dd>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-neutro-50 p-4 border border-neutro-100">
                <Sparkles className="size-5 text-bronce-600 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-neutro-500 font-medium">{textosEventos.tarifaBaseLabel}</dt>
                  <dd className="text-base font-bold text-neutro-900">{formatearGTQ(salon.tarifa_base)}</dd>
                </div>
              </div>
            </dl>
          </Card>

          <Card className="p-6 bg-selva-50/50 border-selva-200">
            <div className="flex items-start gap-3">
              <ShieldCheck className="size-5 text-selva-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <h3 className="font-serif text-base font-bold text-selva-900">
                  {textosEventos.condicionesAlquiler}
                </h3>
                <p className="text-xs text-selva-800 leading-relaxed">
                  {textosEventos.condicionesTexto}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Columna Lateral de Acción */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-6 border-bronce-200 shadow-md">
            <div>
              <p className="eyebrow text-bronce-700">Cotización formal</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-neutro-900">
                  {formatearGTQ(salon.tarifa_base)}
                </span>
                <span className="text-xs text-neutro-500">tarifa base</span>
              </div>
              <p className="mt-2 text-xs text-neutro-600">
                El importe final se calculará de acuerdo a los servicios adicionales de catering, mobiliario y tecnología que añada a su solicitud.
              </p>
            </div>

            <Button
              variant="primary"
              className="w-full justify-center py-3 text-sm font-semibold"
              onClick={() => setModalAbierto(true)}
            >
              {textosEventos.solicitarCotizacion}
            </Button>
          </Card>
        </div>
      </div>

      {modalAbierto && (
        <ReservaEventoModal
          salon={salon}
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </section>
  );
};
