import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, Clock, MapPin, QrCode, Plus, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { useMisReservasAmenidadQuery } from '../hooks/useReservasAmenidad';
import { AMENIDADES_ROUTES } from '../constants/routes';
import { textosAmenidades } from '../textos';
import { MisReservasLayout } from '@/features/mis-reservas/components/MisReservasLayout';
import { cn } from '@/lib/cn';
import type { ReservaAmenidadEstado } from '../types';

function estadoClase(estado: ReservaAmenidadEstado) {
  switch (estado) {
    case 'confirmada':
      return 'border-exito-600/20 bg-exito-50 text-exito-700';
    case 'usada':
      return 'border-neutro-200 bg-neutro-100 text-neutro-600';
    case 'cancelada':
      return 'border-error-600/20 bg-error-50 text-error-700';
    default:
      return 'border-neutro-200 bg-neutro-100 text-neutro-600';
  }
}

export const MisReservasAmenidadesList: React.FC = () => {
  const { status, user } = useAuth();
  const t = textosAmenidades.cliente;

  const isCliente = status === 'authenticated' && user?.rol === 'cliente';
  const reservasQuery = useMisReservasAmenidadQuery(user?.id, isCliente);
  const reservas = reservasQuery.data ?? [];

  return (
    <MisReservasLayout>
      <div className="flex flex-col gap-6">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-serif font-semibold text-neutro-900 sm:text-2xl">
              {t.pestanaAmenidades}
            </h1>
            {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
              <p className="text-xs text-neutro-500">
                {reservas.length === 1 ? "1 reserva" : `${reservas.length} reservas`}
              </p>
            )}
          </div>
          <Link
            to={AMENIDADES_ROUTES.CATALOGO}
            className={buttonStyles({
              variant: 'primary',
              size: 'sm',
              className: 'self-start sm:self-center',
            })}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>{t.explorarCatalogo}</span>
          </Link>
        </div>

        {/* Cargando */}
        {reservasQuery.isPending && (
          <div className="flex justify-center py-12">
            <LoadingNotice label={t.cargandoReservas} />
          </div>
        )}

        {/* Error */}
        {reservasQuery.isError && (
          <Card className="flex flex-col items-start gap-4">
            <Alert tone="error" title={t.errorCargarReservas}>
              Ocurrió un problema al consultar sus reservas de amenidades.
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

        {/* Estado vacío */}
        {!reservasQuery.isPending && !reservasQuery.isError && reservas.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <Sparkles className="size-10 text-neutro-300" aria-hidden="true" />
            <div className="flex max-w-sm flex-col gap-1">
              <h2 className="text-base font-serif font-semibold text-neutro-800">
                {t.sinReservasTitulo}
              </h2>
              <p className="text-xs text-neutro-500">{t.sinReservasDesc}</p>
            </div>
            <Link
              to={AMENIDADES_ROUTES.CATALOGO}
              className={buttonStyles({ variant: 'primary', size: 'sm' })}
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>{t.explorarCatalogo}</span>
            </Link>
          </Card>
        )}

        {/* Listado */}
        {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {reservas.map((reserva) => {
              const estadoTexto = t.estados[reserva.estado] || reserva.estado;
              const sedeNombre = reserva.Amenidad?.Sucursal?.nombre || 'Hotel Hunahpú';

              return (
                <article
                  key={reserva.id}
                  className="surface flex flex-col gap-3 p-4 transition-shadow hover:shadow-md"
                >
                  {/* Cabecera */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-bronce-700">
                        Pase #{reserva.id}
                      </p>
                      <h2 className="truncate text-sm font-semibold text-neutro-900">
                        {reserva.Amenidad?.nombre || 'Amenidad'}
                      </h2>
                    </div>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                        estadoClase(reserva.estado),
                      )}
                    >
                      {estadoTexto}
                    </span>
                  </div>

                  {/* Detalles compactos */}
                  <dl className="flex flex-col gap-1.5 text-xs text-neutro-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0 text-neutro-400" aria-hidden="true" />
                      <dt className="sr-only">Sede</dt>
                      <dd className="truncate">{sedeNombre}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 shrink-0 text-neutro-400" aria-hidden="true" />
                      <dt className="sr-only">Fecha</dt>
                      <dd>{reserva.fecha}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 shrink-0 text-neutro-400" aria-hidden="true" />
                      <dt className="sr-only">Franja</dt>
                      <dd>{reserva.franja_horaria}</dd>
                    </div>
                    {reserva.mobiliario && reserva.mobiliario !== 'ninguno' && (
                      <div className="text-[0.6875rem] text-neutro-500">
                        Mobiliario:{' '}
                        <strong className="text-neutro-700">{reserva.mobiliario}</strong>
                      </div>
                    )}
                  </dl>

                  {/* Pie: acción */}
                  <div className="mt-auto border-t border-neutro-100 pt-3">
                    <Link
                      to={AMENIDADES_ROUTES.DETALLE_RESERVA(reserva.id)}
                      className={buttonStyles({
                        variant: 'ghost',
                        size: 'sm',
                        className: 'w-full justify-center gap-2',
                      })}
                    >
                      <QrCode className="size-4" aria-hidden="true" />
                      <span>{t.verDetalle}</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </MisReservasLayout>
  );
};
