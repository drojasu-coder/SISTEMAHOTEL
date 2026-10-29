import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Hotel,
  Mail,
  Phone,
  User,
  Users,
  CheckCircle2,
  XCircle,
  LogOut,
} from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { getApiErrorMessage } from '@/api/errors';
import { ReservaEstadoBadge } from '@/features/mis-reservas/components/ReservaEstadoBadge';
import {
  calcularNoches,
  formatGTQ,
  parseReservaId,
  resolverNombreSede,
} from '@/features/mis-reservas/formato';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import {
  useAdminReservaDetalleQuery,
  useUpdateAdminReservaMutation,
  useCancelAdminReservaMutation,
} from '@/features/reservas/admin/hooks/useAdminReservas';
import { useTextosAdminReservas } from '@/features/reservas/admin/textos';
import { titularReserva } from '@/features/reservas/types';
import { CobroEfectivoPanel } from '@/features/reservas/admin/components/CobroEfectivoPanel';
import { useLocale } from '@/i18n/LocaleContext';
import { formatAdminCalendarDate, formatAdminTimestamp } from '@/features/admin-core/adminDates';

interface DatoFilaProps {
  etiqueta: string;
  children: React.ReactNode;
  icono?: React.ComponentType<{ className?: string }>;
}

const DatoFila: React.FC<DatoFilaProps> = ({ etiqueta, children, icono: Icono }) => (
  <div className="flex flex-col gap-1">
    <dt className="eyebrow flex items-center gap-1.5">
      {Icono ? <Icono className="size-3.5 text-neutro-400" aria-hidden="true" /> : null}
      <span>{etiqueta}</span>
    </dt>
    <dd className="text-sm font-medium text-neutro-900 break-words">{children}</dd>
  </div>
);

export const AdminReservaDetallePage: React.FC = () => {
  const textosAdminReservas = useTextosAdminReservas();
  const { locale } = useLocale();
  const params = useParams();
  const rawId = params.id;
  const reservaId = parseReservaId(rawId);

  const reservaQuery = useAdminReservaDetalleQuery(reservaId);
  const sedesQuery = useSedesQuery();
  const updateMutation = useUpdateAdminReservaMutation();
  const cancelMutation = useCancelAdminReservaMutation();

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reserva = reservaQuery.data;
  const sedes = sedesQuery.data ?? [];

  const handleUpdateEstado = async (nuevoEstado: string, label: string) => {
    if (!reservaId) return;
    setActionError(null);
    setActionFeedback(null);
    try {
      await updateMutation.mutateAsync({ id: reservaId, data: { estado: nuevoEstado } });
      setActionFeedback(textosAdminReservas.acciones.estadoActualizado(label));
      reservaQuery.refetch();
    } catch (err: any) {
      setActionError(getApiErrorMessage(err) || textosAdminReservas.acciones.errorActualizar);
    }
  };

  const handleCancelar = async () => {
    if (!reservaId) return;
    if (!window.confirm(textosAdminReservas.acciones.preguntaCancelar)) return;
    setActionError(null);
    setActionFeedback(null);
    try {
      await cancelMutation.mutateAsync(reservaId);
      setActionFeedback(textosAdminReservas.acciones.canceladaOk);
      reservaQuery.refetch();
    } catch (err: any) {
      setActionError(getApiErrorMessage(err) || textosAdminReservas.acciones.errorCancelar);
    }
  };

  const sedesMap = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const sede of sedes) {
      mapa.set(sede.id, sede.nombre);
    }
    return mapa;
  }, [sedes]);

  const habitacion = reserva?.Habitacion;
  const tipo = habitacion?.TipoHabitacion;
  // Titular con cuenta de cliente o huésped sin cuenta (reserva presencial).
  const cliente = reserva ? titularReserva(reserva) : null;
  const noches = reserva
    ? calcularNoches(reserva.fecha_entrada, reserva.fecha_salida)
    : null;
  const importe = reserva ? formatGTQ(reserva.total) : null;
  const nombreSede = reserva ? resolverNombreSede(reserva, sedesMap) : '';

  if (reservaId === null) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-12">
        <Link
          to="/admin/reservas"
          className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'self-start' })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{textosAdminReservas.volverAListado}</span>
        </Link>
        <Card className="flex flex-col items-start gap-4">
          <Alert tone="error" title={textosAdminReservas.detalle.noEncontrada}>
            {textosAdminReservas.detalle.noEncontradaDescripcion}
          </Alert>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-12">
      {/* Botón de retorno al listado */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/admin/reservas"
          className={buttonStyles({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{textosAdminReservas.volverAListado}</span>
        </Link>

        {reserva && <ReservaEstadoBadge estado={reserva.estado} />}
      </div>

      {/* Alertas de acción */}
      {actionFeedback && (
        <Alert tone="success">
          <div className="flex items-center justify-between gap-4">
            <span>{actionFeedback}</span>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              {textosAdminReservas.acciones.cerrar}
            </button>
          </div>
        </Alert>
      )}

      {actionError && (
        <Alert tone="error">
          <div className="flex items-center justify-between gap-4">
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              {textosAdminReservas.acciones.cerrar}
            </button>
          </div>
        </Alert>
      )}

      {/* Estados de carga y error */}
      {reservaQuery.isLoading && (
        <div className="flex justify-center py-16">
          <LoadingNotice label={textosAdminReservas.detalle.cargando} />
        </div>
      )}

      {reservaQuery.isError && (
        <Card className="flex flex-col items-start gap-4">
          <Alert tone="error" title={textosAdminReservas.detalle.errorTitulo}>
            {getApiErrorMessage(reservaQuery.error) ||
              textosAdminReservas.detalle.errorDescripcion}
          </Alert>
          <Button
            type="button"
            variant="ghost"
            onClick={() => reservaQuery.refetch()}
          >
            {textosAdminReservas.detalle.reintentar}
          </Button>
        </Card>
      )}

      {/* Vista de detalle con datos reales */}
      {!reservaQuery.isLoading && !reservaQuery.isError && reserva && (
        <div className="flex flex-col gap-6">
          {/* Encabezado del detalle */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutro-200 pb-4">
            <div className="flex flex-col gap-1">
              <p className="eyebrow">{textosAdminReservas.detalle.subtitulo}</p>
              <h1 className="text-[2rem] leading-tight text-neutro-900 font-serif font-semibold">
                {textosAdminReservas.detalle.reservaId(reserva.id)}
              </h1>
              <p className="text-xs text-neutro-500">
                {textosAdminReservas.detalle.campos.fechaRegistro}: {formatAdminTimestamp(reserva.createdAt, locale)}
              </p>
            </div>

            {/* Barra de acciones operativas */}
            <div className="flex flex-wrap items-center gap-2">
              {reserva.estado === 'pendiente' && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={updateMutation.isPending}
                  onClick={() => handleUpdateEstado('confirmada', textosAdminReservas.estados.confirmada)}
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  <span>{textosAdminReservas.acciones.confirmar}</span>
                </Button>
              )}

              {reserva.estado === 'confirmada' && reserva.fecha_salida <= getTodayInGuatemala() && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  isLoading={updateMutation.isPending}
                  onClick={() => handleUpdateEstado('finalizada', textosAdminReservas.acciones.etiquetaFinalizada)}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  <span>{textosAdminReservas.acciones.finalizar}</span>
                </Button>
              )}

              {reserva.estado !== 'cancelada' && reserva.estado !== 'finalizada' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  isLoading={cancelMutation.isPending}
                  onClick={handleCancelar}
                  className="text-error-600 hover:bg-error-50 hover:text-error-700"
                >
                  <XCircle className="size-4" aria-hidden="true" />
                  <span>{textosAdminReservas.acciones.cancelar}</span>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Sección: Datos del Cliente */}
            <Card className="flex flex-col gap-4">
              <h2 className="text-base font-semibold text-neutro-900 border-b border-neutro-100 pb-2">
                {textosAdminReservas.detalle.secciones.cliente}
              </h2>
              <dl className="grid grid-cols-1 gap-4">
                <DatoFila
                  etiqueta={textosAdminReservas.detalle.campos.clienteNombre}
                  icono={User}
                >
                  {cliente?.nombre ?? textosAdminReservas.detalle.valores.sinTelefono}
                  {cliente?.sinCuenta && <span className="ml-2 rounded-full bg-neutro-100 px-2 py-0.5 text-xs font-medium text-neutro-600">{locale === 'en' ? 'Guest without account' : 'Huésped sin cuenta'}</span>}
                </DatoFila>
                <DatoFila
                  etiqueta={textosAdminReservas.detalle.campos.clienteEmail}
                  icono={Mail}
                >
                  {cliente?.email ?? textosAdminReservas.detalle.valores.sinTelefono}
                </DatoFila>
                <DatoFila
                  etiqueta={textosAdminReservas.detalle.campos.clienteTelefono}
                  icono={Phone}
                >
                  {cliente?.telefono ?? textosAdminReservas.detalle.valores.sinTelefono}
                </DatoFila>
              </dl>
            </Card>

            {/* Sección: Datos de la Estancia */}
            <Card className="flex flex-col gap-4">
              <h2 className="text-base font-semibold text-neutro-900 border-b border-neutro-100 pb-2">
                {textosAdminReservas.detalle.secciones.estancia}
              </h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DatoFila
                  etiqueta={textosAdminReservas.detalle.campos.sede}
                  icono={Hotel}
                >
                  {nombreSede}
                </DatoFila>
                <DatoFila
                  etiqueta={textosAdminReservas.detalle.campos.huespedes}
                  icono={Users}
                >
                  {textosAdminReservas.detalle.valores.formatoHuespedes(reserva.numero_huespedes)}
                </DatoFila>
                <DatoFila etiqueta={textosAdminReservas.detalle.campos.habitacionNumero}>
                  {habitacion
                    ? <Link to={'/admin/habitaciones?q=' + encodeURIComponent(habitacion.numero)} className="text-bronce-700 underline-offset-2 hover:underline">{textosAdminReservas.detalle.valores.habitacion(habitacion.numero)}</Link>
                    : textosAdminReservas.detalle.valores.sinHabitacion}
                </DatoFila>
                <DatoFila etiqueta={textosAdminReservas.detalle.campos.habitacionTipo}>
                  {tipo?.nombre ?? textosAdminReservas.detalle.valores.sinTipo}
                </DatoFila>
                <DatoFila
                  etiqueta={textosAdminReservas.detalle.campos.fechaEntrada}
                  icono={Calendar}
                >
                  {formatAdminCalendarDate(reserva.fecha_entrada, locale)}
                </DatoFila>
                <DatoFila
                  etiqueta={textosAdminReservas.detalle.campos.fechaSalida}
                  icono={Calendar}
                >
                  {formatAdminCalendarDate(reserva.fecha_salida, locale)}
                </DatoFila>
                {noches !== null && (
                  <div className="sm:col-span-2">
                    <DatoFila etiqueta={textosAdminReservas.detalle.campos.noches}>
                      {textosAdminReservas.detalle.valores.formatoNoches(noches)}
                    </DatoFila>
                  </div>
                )}
              </dl>
            </Card>
          </div>

          {/* Sección: Registro Financiero */}
          <Card className="flex flex-col gap-3 bg-bronce-50 border-bronce-200/80">
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-bronce-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-neutro-900">
                {textosAdminReservas.detalle.secciones.financiero}
              </h2>
            </div>
            <div className="flex flex-col gap-1 border-t border-bronce-200/80 pt-3">
              <p className="eyebrow text-neutro-600">
                {textosAdminReservas.detalle.campos.importeTotal}
              </p>
              <p className="font-serif text-[2.25rem] font-bold text-neutro-900 leading-tight">
                {importe ?? textosAdminReservas.detalle.campos.importeNoDisponible}
              </p>
              <p className="text-xs text-neutro-600 mt-1">
                {textosAdminReservas.detalle.campos.importeNota}
              </p>
            </div>
            {formatGTQ(tipo?.tarifa_noche) && (
              <div className="flex flex-col gap-1 border-t border-bronce-200/80 pt-3">
                <p className="eyebrow text-neutro-600">
                  {textosAdminReservas.detalle.campos.tarifaActual}
                </p>
                <p className="text-base font-semibold text-neutro-800">
                  {formatGTQ(tipo?.tarifa_noche)} / noche
                </p>
                <p className="text-xs text-neutro-600">
                  {textosAdminReservas.detalle.campos.tarifaActualNota}
                </p>
              </div>
            )}
          </Card>

          {/* Cobro en efectivo de recepción: saldo calculado por el servidor */}
          {reserva.estado === 'pendiente' && <CobroEfectivoPanel reservaId={reserva.id} estadoReserva={reserva.estado} />}
        </div>
      )}
    </div>
  );
};
