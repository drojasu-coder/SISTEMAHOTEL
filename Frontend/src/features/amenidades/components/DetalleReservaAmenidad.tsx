import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Armchair,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { useReservaAmenidadDetalleQuery } from '../hooks/useReservasAmenidad';
import { AMENIDADES_ROUTES } from '../constants/routes';
import { textosAmenidades } from '../textos';
import type { ReservaAmenidadEstado } from '../types';

function estadoBadgeClase(estado: ReservaAmenidadEstado) {
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

export const DetalleReservaAmenidad: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const reservaId = Number(id);

  const { status, user } = useAuth();
  const t = textosAmenidades.cliente;

  const isCliente = status === 'authenticated' && user?.rol === 'cliente';
  const isValidId = Number.isSafeInteger(reservaId) && reservaId > 0;

  const detalleQuery = useReservaAmenidadDetalleQuery(
    isValidId ? reservaId : 0,
    user?.id,
    isCliente && isValidId
  );

  const reserva = detalleQuery.data;

  if (!isValidId) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Alert tone="error" title="Identificador inválido">
          <p>El identificador de reserva proporcionado no es válido.</p>
        </Alert>
        <Link
          to={AMENIDADES_ROUTES.MIS_RESERVAS}
          className={buttonStyles({ variant: 'ghost' })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t.volverMisReservas}</span>
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      {/* Retorno */}
      <div>
        <Link
          to={AMENIDADES_ROUTES.MIS_RESERVAS}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-neutro-900 transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t.volverMisReservas}</span>
        </Link>
      </div>

      {/* Estados de carga / error */}
      {detalleQuery.isPending && (
        <div className="flex justify-center py-16">
          <LoadingNotice label="Cargando pase de acceso..." />
        </div>
      )}

      {detalleQuery.isError && (
        <Card className="flex flex-col items-start gap-4 p-6">
          <Alert
            tone="error"
            title={t.reservaNoEncontrada}
          >
            <p>
              No fue posible recuperar la reserva #{reservaId}. Verifique que el enlace sea correcto y pertenezca a su cuenta.
            </p>
          </Alert>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => detalleQuery.refetch()}
            >
              <RefreshCw className="mr-2 size-4" aria-hidden="true" />
              {t.reintentar}
            </Button>
            <Link
              to={AMENIDADES_ROUTES.MIS_RESERVAS}
              className={buttonStyles({ variant: 'ghost' })}
            >
              {t.volverMisReservas}
            </Link>
          </div>
        </Card>
      )}

      {/* Detalle y Pase QR */}
      {!detalleQuery.isPending && !detalleQuery.isError && reserva && (
        <div className="flex flex-col gap-6">
          {/* Encabezado */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-neutro-200 pb-4">
            <div>
              <p className="eyebrow">{t.detalleSubtitulo}</p>
              <h1 className="text-2xl font-serif font-bold text-neutro-900 sm:text-3xl">
                {reserva.Amenidad?.nombre || 'Reserva de Amenidad'}
              </h1>
              <p className="text-sm text-neutro-600">
                Reserva #{reserva.id} &bull; Registrada el {new Date(reserva.createdAt).toLocaleDateString('es-GT')}
              </p>
            </div>

            <span
              className={`inline-flex items-center self-start sm:self-center rounded-full border px-3 py-1 text-sm font-semibold ${estadoBadgeClase(
                reserva.estado
              )}`}
            >
              {t.estados[reserva.estado] || reserva.estado}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Pase QR / Acceso */}
            <Card className="flex flex-col items-center justify-center p-6 text-center md:col-span-5 bg-white border border-neutro-200">
              <h2 className="text-base font-serif font-bold text-neutro-900 mb-4">
                {t.codigoQrTitulo}
              </h2>

              {reserva.codigo_qr ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-xl border border-neutro-200 bg-white p-3 shadow-sm">
                    <QRCodeSVG
                      value={reserva.codigo_qr}
                      size={180}
                      level="M"
                      includeMargin
                      aria-label={`Código QR para reserva ${reserva.id}`}
                    />
                  </div>

                  <div className="flex flex-col gap-1 max-w-xs">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutro-500">
                      {t.codigoAcceso}
                    </span>
                    <code className="rounded bg-neutro-100 px-2 py-1 font-mono text-xs font-bold text-neutro-800 break-all select-all">
                      {reserva.codigo_qr}
                    </code>
                  </div>

                  <p className="text-xs text-neutro-500 max-w-xs leading-relaxed">
                    {t.codigoQrInstruccion}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-neutro-500 text-xs">
                  <AlertCircle className="size-8 text-neutro-400" aria-hidden="true" />
                  <span>Código de acceso pendiente de confirmación</span>
                </div>
              )}
            </Card>

            {/* Datos de la reserva */}
            <Card className="flex flex-col gap-6 p-6 md:col-span-7 border border-neutro-200">
              <h2 className="text-base font-serif font-bold text-neutro-900 border-b border-neutro-100 pb-2">
                Información de la Visita
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="size-5 shrink-0 text-bronce-600 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="block text-xs font-medium text-neutro-500">Sede</span>
                    <span className="font-semibold text-neutro-900">
                      {reserva.Amenidad?.Sucursal?.nombre || 'Hotel Hunapú'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="size-5 shrink-0 text-bronce-600 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="block text-xs font-medium text-neutro-500">Aforo máximo</span>
                    <span className="font-semibold text-neutro-900">
                      {reserva.Amenidad?.aforo_maximo || 1} personas
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="size-5 shrink-0 text-bronce-600 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="block text-xs font-medium text-neutro-500">Fecha reservada</span>
                    <span className="font-semibold text-neutro-900">{reserva.fecha}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="size-5 shrink-0 text-bronce-600 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="block text-xs font-medium text-neutro-500">Horario</span>
                    <span className="font-semibold text-neutro-900">{reserva.franja_horaria}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:col-span-2 border-t border-neutro-100 pt-3">
                  <Armchair className="size-5 shrink-0 text-bronce-600 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="block text-xs font-medium text-neutro-500">Mobiliario / Requerimiento</span>
                    <span className="font-semibold text-neutro-900">
                      {reserva.mobiliario && reserva.mobiliario !== 'ninguno'
                        ? reserva.mobiliario
                        : 'Sin requerimientos adicionales'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-neutro-50 border border-neutro-200 p-4 text-xs text-neutro-600 leading-relaxed mt-2">
                <p>
                  <strong>Importante:</strong> Esta reserva representa el acceso personal a las instalaciones para el titular. Para dudas o cancelaciones con anticipación, comuníquese con el personal de recepción.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
};
