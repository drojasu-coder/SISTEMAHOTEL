import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';
import { Input } from '@/components/ui/Input';
import { ServiceReservationPanel, ServiceAuthNotice } from '@/components/shared/ServiceReservationPanel';
import { useServiceDraft } from '@/features/auth/serviceDraft';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { TranslatedError, type LocalizedError } from '@/i18n/public';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { useDraftSiteGuard, DraftSiteNotice } from '@/features/preferencias/SiteContextNotice';
import React, { useEffect, useState } from 'react';
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

  const isCliente = status === 'authenticated' && user?.rol === 'cliente';

  // Obtener fecha de hoy en formato local YYYY-MM-DD
  const hoy = getTodayInGuatemala();
  const draft = useServiceDraft('amenidades', amenidad?.id ?? 0, { fecha: hoy, horaInicio: '', horaFin: '', mobiliario: '' });

  const [fecha, setFecha] = useState(draft.initial.fecha);
  const [horaInicio, setHoraInicio] = useState(draft.initial.horaInicio);
  const [horaFin, setHoraFin] = useState(draft.initial.horaFin);
  const [mobiliario, setMobiliario] = useState(draft.initial.mobiliario);
  const [errorLocal, setErrorLocal] = useState<LocalizedError | null>(null);
  const [falloIncierto, setFalloIncierto] = useState(false);
  const [reservaCreada, setReservaCreada] = useState<ReservaAmenidad | null>(null);

  const createMutation = useCreateReservaAmenidadMutation();

  useEffect(() => { if (amenidad && !reservaCreada) draft.save({ fecha, horaInicio, horaFin, mobiliario }); }, [amenidad?.id, fecha, horaInicio, horaFin, mobiliario, reservaCreada, draft.save]);

  if (!isOpen || !amenidad) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    setFalloIncierto(false);

    if (!isCliente) {
      setErrorLocal({ section: 'amenidades', key: 'cliente.debeIniciarSesion' });
      return;
    }

    if (!fecha) {
      setErrorLocal({ section: 'extra', key: 'requiredReservationDate' });
      return;
    }

    if (!horaInicio || !horaFin) {
      setErrorLocal({ section: 'extra', key: 'requiredTimeRange' });
      return;
    }

    if (horaInicio >= horaFin) {
      setErrorLocal({ section: 'amenidades', key: 'cliente.horaInvalida' });
      return;
    }

    const franja_horaria = `${horaInicio}-${horaFin}`;

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

      if (apiCode === 'AMENITY_NOT_RESERVABLE') {
        setErrorLocal({ server: access('notReservable') });
      } else if (apiCode === 'AMENITY_CAPACITY_FULL') {
        setErrorLocal({ section: 'amenidades', key: 'cliente.capacidadExcedida' });
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
                  handleCerrar();
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
                  handleCerrar();
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
              <p className="eyebrow"><span lang="es">{amenidad.Sucursal?.nombre || 'Hotel Hunahpú'}</span></p>

              <p className="text-sm text-neutro-600">
                <span lang="es">{amenidad.nombre}</span> • {p('maxCapacity')} {amenidad.aforo_maximo} {' '}{p('people')}{' '}</p>
            </div>

            {amenidad.reservable === false ? <div className="space-y-4">
              <Alert tone="info" title={access('notReservableTitle')}><p>{access('notReservable')}</p></Alert>
              <div className="flex justify-end"><Button type="button" variant="secondary" onClick={handleCerrar}>{access('close')}</Button></div>
            </div> : <>
            <ServiceAuthNotice kind="amenidades" resourceId={amenidad.id} />

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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TimeField id="reserva-hora-inicio" label={t.horaInicioLabel} name="horaInicio" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required disabled={createMutation.isPending} />
                <TimeField id="reserva-hora-fin" label={t.horaFinLabel} name="horaFin" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required disabled={createMutation.isPending} />
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
                  disabled={!isCliente || createMutation.isPending}
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
