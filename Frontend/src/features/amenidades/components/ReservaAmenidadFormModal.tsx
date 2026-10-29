import { DateField } from '@/components/ui/DateField';
import { SlotPicker } from '@/components/ui/SlotPicker';
import { formatearHoraFranja, sumarMinutos, useTextosFranjas } from '@/i18n/franjas';
import { Input } from '@/components/ui/Input';
import { ServiceReservationPanel, ServiceAuthNotice } from '@/components/shared/ServiceReservationPanel';
import { useServiceDraft } from '@/features/auth/serviceDraft';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { TranslatedError, type LocalizedError } from '@/i18n/public';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { useDraftSiteGuard, DraftSiteNotice } from '@/features/preferencias/SiteContextNotice';
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { amenidadesApi } from '../api/amenidadesApi';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { useAccessCopy } from '../accessCopy';
import { useAuth } from '@/features/auth/AuthContext';
import { useCreateReservaAmenidadMutation } from '../hooks/useReservasAmenidad';
import { AMENIDADES_ROUTES } from '../constants/routes';

import type { Amenidad, ReservaAmenidad } from '../types';

interface ReservaAmenidadFormModalProps {
  amenidad: Amenidad | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReservaAmenidadFormModal: React.FC<ReservaAmenidadFormModalProps> = ({
  amenidad,
  isOpen,
  onClose,
}) => {
  const textosAmenidades = usePublicTexts('amenidades');
  const { p , date: calendarDate } = usePublicInterface();
  const access = useAccessCopy();
  const navigate = useNavigate();
  const siteBlocked = useDraftSiteGuard(amenidad?.id, amenidad?.sucursal_id);
  const { status, user } = useAuth();
  const t = textosAmenidades.cliente;
  const { t: tf, locale } = useTextosFranjas();

  const isCliente = status === 'authenticated' && user?.rol === 'cliente';

  // Obtener fecha de hoy en formato local YYYY-MM-DD
  const hoy = getTodayInGuatemala();
  const draft = useServiceDraft('amenidades', amenidad?.id ?? 0, { fecha: hoy, horaInicio: '', horaFin: '', mobiliario: '' });

  const [fecha, setFecha] = useState(draft.initial.fecha);
  const [horaInicio, setHoraInicio] = useState(draft.initial.horaInicio);
  const [mobiliario, setMobiliario] = useState(draft.initial.mobiliario);
  const [errorLocal, setErrorLocal] = useState<LocalizedError | null>(null);
  const [falloIncierto, setFalloIncierto] = useState(false);
  const [reservaCreada, setReservaCreada] = useState<ReservaAmenidad | null>(null);
  // Código de un rechazo de franja (fuera de horario, duración, pasado); se traduce al mostrarlo.
  const [errorFranja, setErrorFranja] = useState<string | null>(null);
  const disponibilidadQuery = useQuery({
    queryKey: ['amenidad-disponibilidad', amenidad?.id, fecha],
    queryFn: () => amenidadesApi.getDisponibilidad(amenidad!.id, fecha),
    enabled: Boolean(amenidad?.id) && amenidad?.reservable !== false && /^\d{4}-\d{2}-\d{2}$/.test(fecha ?? ''),
    staleTime: 30_000,
    retry: false,
  });
  // Franjas del backend: horario de la amenidad, duración fija y plazas libres según el aforo.
  const disponibilidad = disponibilidadQuery.data;
  const franjas = (disponibilidad?.horarios ?? []).filter((franja) => franja.disponibles > 0).map((franja) => franja.inicio);
  const horaValida = Boolean(horaInicio) && franjas.includes(horaInicio.slice(0, 5));
  const horaFin = horaValida && disponibilidad?.duracion_minutos ? sumarMinutos(horaInicio.slice(0, 5), disponibilidad.duracion_minutos) : '';

  // Al cambiar de fecha, una hora que ya no se ofrece deja de estar elegida.
  useEffect(() => {
    if (disponibilidadQuery.isSuccess && horaInicio && !franjas.includes(horaInicio.slice(0, 5))) setHoraInicio('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disponibilidadQuery.data]);

  const createMutation = useCreateReservaAmenidadMutation();

  useEffect(() => { if (amenidad && !reservaCreada) draft.save({ fecha, horaInicio, horaFin: '', mobiliario }); }, [amenidad?.id, fecha, horaInicio, mobiliario, reservaCreada, draft.save]);

  if (!isOpen || !amenidad) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    setErrorFranja(null);
    setFalloIncierto(false);

    if (!isCliente) {
      setErrorLocal({ section: 'amenidades', key: 'cliente.debeIniciarSesion' });
      return;
    }

    if (!fecha) {
      setErrorLocal({ section: 'extra', key: 'requiredReservationDate' });
      return;
    }

    if (!horaValida || !horaFin) {
      setErrorLocal({ section: 'extra', key: 'requiredTimeRange' });
      return;
    }

    const franja_horaria = `${horaInicio.slice(0, 5)}-${horaFin}`;

    try {
      const created = await createMutation.mutateAsync({
        amenidad_id: amenidad.id,
        fecha,
        franja_horaria,
        mobiliario: mobiliario.trim() ? mobiliario.trim() : null,
      });
      draft.clear();
      setReservaCreada(created);
    } catch (err: any) {
      const apiCode = err?.code || err?.response?.data?.code;
      const apiMsg = err?.message || err?.response?.data?.message;

      if (apiCode && tf.errores[apiCode]) {
        setErrorFranja(apiCode);
        void disponibilidadQuery.refetch();
      } else if (apiCode === 'AMENITY_CAPACITY_FULL') {
        setErrorLocal({ section: 'amenidades', key: 'cliente.capacidadExcedida' });
        void disponibilidadQuery.refetch();
      } else if (apiCode === 'AMENITY_NOT_RESERVABLE') {
        setErrorLocal({ server: access('notReservable') });
      } else if (apiCode === 'AMENITY_RESERVATION_ALREADY_EXISTS') {
        setErrorLocal({ section: 'amenidades', key: 'cliente.reservaDuplicada' });
      } else if (apiCode === 'AMENITY_DATE_IN_PAST') {
        setErrorLocal({ section: 'amenidades', key: 'cliente.fechaEnPasado' });
      } else if (apiCode === 'AMENITY_TIME_SLOT_IN_PAST') {
        setErrorLocal({ section: 'amenidades', key: 'cliente.horaEnPasado' });
      } else if (!err?.status && !err?.response) {
        // Posible fallo de red / incertidumbre
        setFalloIncierto(true);
        setErrorLocal({ section: 'amenidades', key: 'cliente.falloConexionIncierto' });
      } else {
        setErrorLocal(apiMsg ? { server: apiMsg } : { section: 'extra', key: 'amenityRequestError' });
      }
    }
  };

  const handleCerrar = () => {
    if (createMutation.isPending) return;
    setErrorLocal(null);
    setFalloIncierto(false);
    setReservaCreada(null);
    onClose();
  };

  return (
    <ServiceReservationPanel name={amenidad.nombre} siteId={amenidad.sucursal_id} siteName={amenidad.Sucursal?.nombre} media={{ src: amenidad.imagen_url, alt: amenidad.nombre, credits: amenidad.imagen_creditos }} open onClose={handleCerrar} closeLabel={t.cerrar} title={reservaCreada ? t.reservaExitosaTitulo : t.reservarModalTitulo} busy={createMutation.isPending} busyLabel={p('processingRequest')}>
        {reservaCreada ? (
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-verde-100 text-verde-700">
              <CheckCircle className="size-8" aria-hidden="true" />
            </div>

            <p className="text-sm text-neutro-600 max-w-md">
              {t.reservaExitosaDesc}
            </p>
            <p className="text-xs text-neutro-600 max-w-md">{p('noOnlinePayment')}</p>

            <div className="w-full rounded-lg bg-neutro-50 border border-neutro-200 p-4 text-left text-xs space-y-2 mt-2">
              <div className="flex justify-between">
                <span className="text-neutro-500">{p('amenity')}</span>
                <span className="font-semibold text-neutro-800"><span lang="es">{amenidad.nombre}</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{p('date')}</span>
                <span className="font-semibold text-neutro-800">{calendarDate(reservaCreada.fecha)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{p('timeSlot')}</span>
                <span className="font-semibold text-neutro-800">{reservaCreada.franja_horaria}</span>
              </div>
              {reservaCreada.codigo_qr && (
                <div className="flex justify-between border-t border-neutro-200 pt-2">
                  <span className="text-neutro-500">{p('accessCode')}</span>
                  <span className="font-mono font-bold text-neutro-900">{reservaCreada.codigo_qr}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                onClick={() => {
                  // Navegar directo: cerrar el panel hace navigate(-1) y revertiría este destino.
                  navigate(AMENIDADES_ROUTES.DETALLE_RESERVA(reservaCreada.id));
                }}
              >
                {t.verDetalle}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  // Navegar directo: cerrar el panel hace navigate(-1) y revertiría este destino.
                  navigate(AMENIDADES_ROUTES.MIS_RESERVAS);
                }}
              >
                {t.irMisReservas}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex flex-col gap-1">

              {amenidad.reservable !== false && <p className="text-sm text-neutro-600">{Number(amenidad.aforo_maximo) === 1 ? tf.usoExclusivo : tf.usoCompartido(Number(amenidad.aforo_maximo))}</p>}
            </div>

            {amenidad.reservable === false ? <div className="space-y-4">
              <Alert tone="info" title={access('notReservableTitle')}><p>{access('notReservable')}</p></Alert>
              <div className="flex justify-end"><Button type="button" variant="secondary" onClick={handleCerrar}>{access('close')}</Button></div>
            </div> : <>
            <ServiceAuthNotice kind="amenidades" resourceId={amenidad.id} />

            {errorFranja && <div className="mb-4"><Alert tone="warning"><p>{tf.errores[errorFranja]}</p></Alert></div>}
            {errorLocal && (
              <div className="mb-4">
                <Alert tone={falloIncierto ? 'warning' : 'error'} title={falloIncierto ? p('connectionNotice') : p('reservationError')}>
                  <p><TranslatedError error={errorLocal} /></p>
                  {falloIncierto && (
                    <div className="mt-2">
                      <Link
                        to={AMENIDADES_ROUTES.MIS_RESERVAS}
                        className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                      >
                        {t.comprobarMisReservas}
                      </Link>
                    </div>
                  )}
                </Alert>
              </div>
            )}

            <form onSubmit={(event) => { if (siteBlocked || createMutation.isPending) { event.preventDefault(); return; } void handleSubmit(event); }} className="flex flex-col gap-4">
              <DraftSiteNotice blocked={siteBlocked} /><fieldset disabled={siteBlocked} className="contents">
              <DateField id="reserva-fecha" label={t.fechaLabel} name="fecha" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} required disabled={createMutation.isPending} />
              {/* Franjas disponibles: solo las que ofrece el backend con plazas libres */}
              <div className="flex flex-col gap-2" aria-live="polite">
                {disponibilidadQuery.isPending && disponibilidadQuery.fetchStatus !== 'idle' ? <p className="text-xs text-neutro-600">{tf.cargando}</p>
                  : disponibilidadQuery.isError ? <Alert tone="error"><p className="text-xs">{tf.error}</p><Button type="button" variant="ghost" size="sm" onClick={() => void disponibilidadQuery.refetch()}>{tf.reintentar}</Button></Alert>
                  : disponibilidad && (!disponibilidad.horario || !disponibilidad.duracion_minutos) ? <Alert tone="info" title={tf.sinHorarioTitulo}><p className="text-xs">{tf.sinHorario}</p></Alert>
                  : disponibilidad?.horario && disponibilidad.duracion_minutos && <>
                    <p className="text-xs text-neutro-600">{tf.horarioAtencion(formatearHoraFranja(disponibilidad.horario.apertura, locale), formatearHoraFranja(disponibilidad.horario.cierre, locale))} {tf.duracionFija(disponibilidad.duracion_minutos)}</p>
                    {franjas.length === 0 ? <p className="rounded-md border border-neutro-200 bg-neutro-50 p-3 text-xs text-neutro-700">{tf.sinFranjas}</p>
                      : <SlotPicker label={tf.horaInicio} slots={franjas} value={horaInicio} onChange={setHoraInicio} durationMinutes={disponibilidad.duracion_minutos} disabled={createMutation.isPending} />}
                  </>}
              </div>
              <Input label={t.mobiliarioLabel} id="reserva-mobiliario" name="mobiliario" maxLength={30} placeholder={t.mobiliarioPlaceholder} value={mobiliario} onChange={(e) => setMobiliario(e.target.value)} disabled={createMutation.isPending} />

              <div className="mt-4 flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCerrar}
                  disabled={createMutation.isPending}
                >
                  {t.cerrar}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={createMutation.isPending}
                  disabled={!isCliente || createMutation.isPending || !horaValida}
                >
                  {createMutation.isPending ? t.confirmando : t.confirmarReserva}
                </Button>
              </div>
            </fieldset></form>
            </>}
          </div>
        )}
    </ServiceReservationPanel>
  );
};
