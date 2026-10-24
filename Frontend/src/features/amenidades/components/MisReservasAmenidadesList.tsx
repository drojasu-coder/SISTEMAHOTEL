import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, Clock, MapPin, QrCode, Plus, BedDouble, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { useMisReservasAmenidadQuery } from '../hooks/useReservasAmenidad';
import { AMENIDADES_ROUTES } from '../constants/routes';
import { textosAmenidades } from '../textos';
import type { ReservaAmenidadEstado } from '../types';

function estadoClase(estado: ReservaAmenidadEstado) {
  switch (estado) {
    case 'confirmada':
      return 'bg-verde-100 text-verde-800 border-verde-200';
    case 'usada':
      return 'bg-neutro-100 text-neutro-800 border-neutro-200';
    case 'cancelada':
      return 'bg-rojo-100 text-rojo-800 border-rojo-200';
    default:
      return 'bg-neutro-100 text-neutro-800 border-neutro-200';
  }
}

export const MisReservasAmenidadesList: React.FC = () => {
  const { status, user } = useAuth();
  const t = textosAmenidades.cliente;

  const isCliente = status === 'authenticated' && user?.rol === 'cliente';
  const reservasQuery = useMisReservasAmenidadQuery(user?.id, isCliente);
  const reservas = reservasQuery.data ?? [];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Pestañas de navegación entre habitaciones y amenidades */}
      <div className="flex border-b border-neutro-200">
        <Link
          to={RESERVAS_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors"
        >
          <BedDouble className="size-4" aria-hidden="true" />
          <span>{t.pestanaHabitaciones}</span>
        </Link>
        <Link
          to={AMENIDADES_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-bronce-600 px-4 py-3 text-sm font-semibold text-bronce-700"
          aria-current="page"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          <span>{t.pestanaAmenidades}</span>
        </Link>
      </div>

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{t.misReservasSubtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
            {t.misReservasTitulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {t.misReservasDescripcion}
          </p>
        </div>

        <Link
          to={AMENIDADES_ROUTES.CATALOGO}
          className={buttonStyles({
            variant: 'primary',
            className: 'self-start sm:self-center',
          })}
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>{t.explorarCatalogo}</span>
        </Link>
      </div>

      {/* Estados de carga / error */}
      {reservasQuery.isPending && (
        <div className="flex justify-center py-12">
          <LoadingNotice label={t.cargandoReservas} />
        </div>
      )}

      {reservasQuery.isError && (
        <Card className="flex flex-col items-start gap-4 p-6">
          <Alert tone="error" title={t.errorCargarReservas}>
            <p>Ocurrió un problema al consultar sus reservas de amenidades.</p>
          </Alert>
          <Button
            type="button"
            variant="ghost"
            onClick={() => reservasQuery.refetch()}
          >
            <RefreshCw className="mr-2 size-4" aria-hidden="true" />
            {t.reintentar}
          </Button>
        </Card>
      )}

      {/* Sin reservas */}
      {!reservasQuery.isPending && !reservasQuery.isError && reservas.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <Sparkles className="size-12 text-neutro-400" aria-hidden="true" />
          <div className="flex max-w-md flex-col gap-1">
            <h2 className="text-lg font-serif font-semibold text-neutro-800">
              {t.sinReservasTitulo}
            </h2>
            <p className="text-xs text-neutro-600">
              {t.sinReservasDesc}
            </p>
          </div>
          <Link
            to={AMENIDADES_ROUTES.CATALOGO}
            className={buttonStyles({ variant: 'primary' })}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>{t.explorarCatalogo}</span>
          </Link>
        </Card>
      )}

      {/* Listado de reservas de amenidades */}
      {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reservas.map((reserva) => {
            const estadoTexto = t.estados[reserva.estado] || reserva.estado;
            const sedeNombre = reserva.Amenidad?.Sucursal?.nombre || 'Hotel Hunapú';

            return (
              <Card
                key={reserva.id}
                className="flex flex-col justify-between overflow-hidden border border-neutro-200 transition-shadow hover:shadow-md"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="flex items-center gap-1 text-xs text-neutro-500 font-medium">
                      <MapPin className="size-3.5 text-bronce-600 shrink-0" aria-hidden="true" />
                      <span className="truncate">{sedeNombre}</span>
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoClase(
                        reserva.estado
                      )}`}
                    >
                      {estadoTexto}
                    </span>
                  </div>

                  <h2 className="text-lg font-serif font-bold text-neutro-900 mb-3">
                    {reserva.Amenidad?.nombre || 'Amenidad'}
                  </h2>

                  <div className="space-y-2 text-xs text-neutro-600 border-t border-neutro-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-neutro-400 shrink-0" aria-hidden="true" />
                      <span>{reserva.fecha}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-neutro-400 shrink-0" aria-hidden="true" />
                      <span>{reserva.franja_horaria}</span>
                    </div>
                    {reserva.mobiliario && reserva.mobiliario !== 'ninguno' && (
                      <div className="text-xs text-neutro-500 pt-1">
                        Mobiliario: <strong className="text-neutro-700">{reserva.mobiliario}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-neutro-200 bg-neutro-50/60 p-4">
                  <Link
                    to={AMENIDADES_ROUTES.DETALLE_RESERVA(reserva.id)}
                    className={buttonStyles({
                      variant: 'primary',
                      className: 'w-full gap-2',
                    })}
                  >
                    <QrCode className="size-4" aria-hidden="true" />
                    <span>{t.verDetalle}</span>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};
