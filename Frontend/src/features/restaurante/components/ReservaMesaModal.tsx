import { DateField } from '@/components/ui/DateField';
import { TranslatedError, type LocalizedError } from '@/i18n/public';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { useDraftSiteGuard, DraftSiteNotice } from '@/features/preferencias/SiteContextNotice';
import React, { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ServiceReservationPanel, ServiceAuthNotice } from '@/components/shared/ServiceReservationPanel';
import { useServiceDraft } from '@/features/auth/serviceDraft';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button, buttonStyles } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { useAuth } from "@/features/auth/AuthContext";
import { useCreateReservaMesaMutation, useDisponibilidadMesaQuery } from "../hooks/useReservasMesa";

import { RESTAURANTE_ROUTES } from "../constants/routes";
import type { MesaConSucursal, ReservaMesa, DisponibilidadMesaResponse } from "../types";
import { ApiError } from "@/api/client/http";
import { CheckCircle2, ArrowRight, MapPin, Minus, Plus, Users } from "lucide-react";
import { validateMesaReservation, normalizeMesaTime, validMesaReservationFields, mesaSlotsFor, RESTAURANT_BOOKING_HOURS, type MesaReservationFields } from '../reservationValidation';
import { readMesaAttempt, saveMesaAttempt } from '../reservationAttempt';
import { restauranteApi } from '../api/restauranteApi';

interface ReservaMesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesa: MesaConSucursal | null;
}

export const ReservaMesaModal: React.FC<ReservaMesaModalProps> = ({
  isOpen,
  onClose,
  mesa,
}) => {
  const textosRestaurante = usePublicTexts('restaurante');
  const { p , date: calendarDate } = usePublicInterface();
  const siteBlocked = useDraftSiteGuard(mesa?.id, mesa?.sucursal_id);
  const { status, user } = useAuth();
  const navigate = useNavigate();
  const createMutation = useCreateReservaMesaMutation();
  const t = textosRestaurante;

  const isCliente = status === "authenticated" && user?.rol === "cliente";

  const { sites } = usePublicPreferences();
  const site = sites.find((item) => item.id === mesa?.sucursal_id);
  const draft = useServiceDraft('restaurante', mesa?.id ?? 0, { fecha: getTodayInGuatemala(), hora: '', comensales: 1 });
  const [uncertain, setUncertain] = useState<MesaReservationFields | null>(() => readMesaAttempt(mesa?.id ?? 0));
  const [fecha, setFecha] = useState<string>(uncertain?.fecha ?? draft.initial.fecha);
  const [hora, setHora] = useState<string>(uncertain?.hora ?? draft.initial.hora);
  const [comensales, setComensales] = useState<number>(uncertain?.numero_comensales ?? draft.initial.comensales);
  const [errorLocal, setErrorLocal] = useState<LocalizedError | null>(null);
  const [reservaConfirmada, setReservaConfirmada] = useState<ReservaMesa | null>(null);
  const submitting = useRef(false);
  const checking = useRef(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkedEmpty, setCheckedEmpty] = useState(false);
  const [checkError, setCheckError] = useState(false);

  const {
    data: disponibilidad,
    isLoading: isDisponibilidadLoading,
    refetch: refetchDisponibilidad,
  } = useDisponibilidadMesaQuery(mesa?.id, fecha);

  useEffect(() => { if (mesa && !reservaConfirmada) draft.save({ fecha, hora, comensales }); }, [mesa?.id, fecha, hora, comensales, reservaConfirmada, draft.save]);
  // Al cambiar la fecha, una hora que ya no se ofrece (pasada o fuera de horario) se descarta.
  useEffect(() => { if (hora && !uncertain && !mesaSlotsFor(fecha).includes(hora.slice(0, 5))) setHora(''); }, [fecha]);
  // Si la disponibilidad reporta que la hora seleccionada está ocupada, se descarta.
  useEffect(() => {
    if (hora && disponibilidad && !disponibilidad.horarios_disponibles.includes(hora.slice(0, 5))) {
      setHora('');
    }
  }, [disponibilidad, hora]);


  const handleClose = () => {
    if (submitting.current || checking.current) return;
    setErrorLocal(null);
    setReservaConfirmada(null);
    onClose();
  };

  if (!mesa) return null;

  const capacidadMaxima = mesa.capacidad;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCliente || submitting.current || uncertain || reservaConfirmada || mesa.estado === 'mantenimiento') return;

    setErrorLocal(null);

    if (!hora) {
      setErrorLocal({ section: 'restaurante', key: 'horaRequerida' });
      return;
    }
    const fields = { fecha, hora, numero_comensales: comensales };
    const validation = validateMesaReservation(fields, capacidadMaxima);
    if (validation) {
      setErrorLocal({ section: 'restaurante', key: validation });
      return;
    }

    submitting.current = true;
    draft.save({ fecha, hora, comensales });
    // Se escribe ANTES del POST: recargar o navegar durante el envío tampoco lo repite.
    saveMesaAttempt(mesa.id, fields);
    try {
      const payload = {
        mesa_id: mesa.id,
        fecha,
        hora,
        numero_comensales: comensales,
      };

      const resultado = await createMutation.mutateAsync(payload);
      if (!resultado || !Number.isSafeInteger(resultado.id) || resultado.id <= 0 || resultado.mesa_id !== mesa.id ||
        resultado.estado !== 'confirmada' || !validMesaReservationFields(resultado)) throw new Error('Unconfirmed reservation response');
      saveMesaAttempt(mesa.id, null);
      draft.clear();
      setReservaConfirmada(resultado);
    } catch (err: unknown) {
      if (!(err instanceof ApiError) || err.status === 0 || err.status === 408 || err.status >= 500) {
        setUncertain(fields);
        return;
      }
      saveMesaAttempt(mesa.id, null);
      if (err.code === "TABLE_UNAVAILABLE" || err.code === "TABLE_RESERVATION_TIME_CONFLICT") {
        setErrorLocal({ section: 'restaurante', key: 'errorMesaOcupada' });
        void refetchDisponibilidad();
      } else if (err.code === "TABLE_IN_MAINTENANCE") {
        setErrorLocal({ section: 'restaurante', key: 'errorMesaMantenimiento' });
      } else if (err.code === "TABLE_CAPACITY_EXCEEDED") {
        setErrorLocal({ section: 'restaurante', key: 'errorCapacidad' });
      } else if (err.code === "TABLE_RESERVATION_DATE_IN_PAST") {
        setErrorLocal({ section: 'restaurante', key: 'errorFechaPasada' });
      } else if (err.code === "TABLE_RESERVATION_TIME_IN_PAST") {
        setErrorLocal({ section: 'restaurante', key: 'errorHoraPasada' });
      } else if (err.code === "TABLE_RESERVATION_OUTSIDE_HOURS") {
        setErrorLocal({ section: 'restaurante', key: 'errorFueraHorario' });
      } else {
        setErrorLocal({ api: err });
      }
    } finally {
      submitting.current = false;
    }
  };

  const checkReservations = async () => {
    if (!uncertain || !isCliente || checking.current) return;
    checking.current = true; setIsChecking(true); setCheckError(false); setCheckedEmpty(false);
    try {
      // Lectura nueva del endpoint propio; no se deduce éxito ni ausencia desde caché.
      const reservations = await restauranteApi.getMyReservas();
      const found = reservations.find((item) => item.estado === 'confirmada' && item.mesa_id === mesa.id &&
        item.fecha === uncertain.fecha && normalizeMesaTime(item.hora) === normalizeMesaTime(uncertain.hora) &&
        item.numero_comensales === uncertain.numero_comensales);
      if (found) {
        saveMesaAttempt(mesa.id, null); draft.clear(); setUncertain(null); setReservaConfirmada(found);
      } else setCheckedEmpty(true);
    } catch { setCheckError(true); }
    finally { checking.current = false; setIsChecking(false); }
  };

  return (
    <ServiceReservationPanel
      name={`${p('table')} #${mesa.id}`} siteId={mesa.sucursal_id} siteName={mesa.Sucursal?.nombre}
      media={{ src: site?.restaurante_imagen_url, alt: `${p('restaurant')} ${site?.nombre ?? ''}`, credits: site?.restaurante_imagen_creditos }}
      compact
      details={<ul className="space-y-1.5 text-sm text-neutro-700">
        {mesa.zona && <li className="flex items-center gap-2"><MapPin className="size-4 shrink-0 text-bronce-600" aria-hidden="true" /><span className="sr-only">{t.zona}: </span><span lang="es">{mesa.zona}</span></li>}
        <li className="flex items-center gap-2"><Users className="size-4 shrink-0 text-bronce-600" aria-hidden="true" />{t.comensalesMax(capacidadMaxima)}</li>
      </ul>}
      busy={createMutation.isPending || isChecking}
      busyLabel={p('processingRequest')}
      open={isOpen}
      onClose={handleClose}
      closeLabel={t.cerrar}
      title={reservaConfirmada ? t.reservaExitosaTitulo : t.reservaModalTitulo}
      description={reservaConfirmada ? t.reservaExitosaDesc : t.reservaModalDesc}
    >
      <div className="space-y-6">
        {reservaConfirmada ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-lg border border-exito-600/20 bg-exito-50 p-4 text-exito-700">
              <CheckCircle2 className="size-6 text-exito-700 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">{t.reservaExitosaTitulo}</p>
                <p className="text-sm">
                  {t.identificadorReserva}: <span className="font-bold">#{reservaConfirmada.id}</span>
                </p>
                <p className="text-xs mt-1">
                  {t.siguienteAccion}
                </p>
                <p className="text-xs mt-1">{p('noOnlinePayment')}</p>
              </div>
            </div>

            <div className="rounded-lg border border-neutro-200 bg-neutro-50 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-neutro-600">{t.cliente.sede}:</span>
                <span className="font-medium text-neutro-900">
                  <span lang="es">{site?.nombre || mesa.Sucursal?.nombre || (mesa.sucursal_id ? `#${mesa.sucursal_id}` : p('siteName'))}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-600">{t.cliente.mesa}:</span>
                <span className="font-medium text-neutro-900">
                  {p('table')} #{reservaConfirmada.mesa_id} (<span lang="es">{reservaConfirmada.Mesa?.zona ?? mesa.zona}</span>)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-600">{t.cliente.fecha}:</span>
                <span className="font-medium text-neutro-900">{calendarDate(reservaConfirmada.fecha)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-600">{t.cliente.hora}:</span>
                <span className="font-medium text-neutro-900">{reservaConfirmada.hora}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-600">{t.cliente.personas}:</span>
                <span className="font-medium text-neutro-900">
                  {t.capacidadPersonas(reservaConfirmada.numero_comensales)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-600">{t.cliente.estado}:</span>
                <StatusBadge domain="reservation" value={reservaConfirmada.estado} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="primary"
                className="flex-1 justify-center"
                onClick={() => {
                  // Navegar directo: handleClose() haría navigate(-1) y revertiría este destino.
                  navigate(RESTAURANTE_ROUTES.DETALLE_RESERVA(reservaConfirmada.id));
                }}
              >
                <span>{t.verDetalle}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="justify-center"
                onClick={() => {
                  // Navegar directo: handleClose() haría navigate(-1) y revertiría este destino.
                  navigate(RESTAURANTE_ROUTES.MIS_RESERVAS);
                }}
              >
                <span>{t.irMisReservas}</span>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={(event) => { if (siteBlocked) { event.preventDefault(); return; } void handleSubmit(event); }} className="space-y-4">
              <ServiceAuthNotice kind="restaurante" resourceId={mesa.id} />
              {mesa.estado === 'mantenimiento' && <Alert tone="warning">{t.errorMesaMantenimiento}</Alert>}
              {uncertain && <Alert tone="warning">
                <p>{t.resultadoIncierto}</p>
                <p className="mt-2 text-sm">{calendarDate(uncertain.fecha)} · {uncertain.hora} · {t.capacidadPersonas(uncertain.numero_comensales)}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link className={buttonStyles({ variant: 'secondary' })} to={RESTAURANTE_ROUTES.MIS_RESERVAS}>{t.irMisReservas}</Link>
                  <Button type="button" variant="secondary" disabled={!isCliente || isChecking} onClick={() => void checkReservations()}>{isChecking ? t.comprobando : t.comprobarReservas}</Button>
                </div>
                {checkError && <p role="alert" className="mt-3">{t.errorComprobar}</p>}
                {checkedEmpty && <div className="mt-3 space-y-3"><p>{t.intentoNoEncontrado}</p><Button type="button" variant="ghost" onClick={() => { saveMesaAttempt(mesa.id, null); setUncertain(null); setCheckedEmpty(false); }}>{t.prepararNuevoEnvio}</Button></div>}
              </Alert>}
              <DraftSiteNotice blocked={siteBlocked} /><fieldset disabled={siteBlocked} className="contents">
            {errorLocal && (
              <Alert tone="error">
                <span className="text-sm"><TranslatedError error={errorLocal} /></span>
              </Alert>
            )}

            <DateField label={t.fechaLabel} id="reserva-fecha" min={getTodayInGuatemala()} value={fecha} onChange={(e) => setFecha(e.target.value)} required disabled={createMutation.isPending || Boolean(uncertain)} />
            <MesaTimeSlots fecha={fecha} value={hora} onChange={setHora} disabled={createMutation.isPending || Boolean(uncertain)} disponibilidad={disponibilidad} isLoading={isDisponibilidadLoading} />
            <PartySize value={comensales} max={capacidadMaxima} onChange={setComensales} disabled={createMutation.isPending || Boolean(uncertain)} />

            {hora && <p aria-live="polite" className="rounded-md border border-bronce-200 bg-bronce-50/60 p-3 text-sm font-medium text-neutro-800">
              <span lang="es">{site?.nombre || mesa.Sucursal?.nombre}</span> · {p('table')} #{mesa.id} · {calendarDate(fecha)} · {hora.slice(0, 5)} · {t.capacidadPersonas(comensales)}
            </p>}
            <p className="text-xs text-neutro-500">{t.disponibilidadAlConfirmar}</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-neutro-200">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={createMutation.isPending}
              >
                {t.cancelar}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isCliente || createMutation.isPending || Boolean(uncertain) || mesa.estado === 'mantenimiento'}
              >
                {createMutation.isPending ? t.confirmando : t.confirmarReserva}
              </Button>
            </div>
          </fieldset></form>
        )}
      </div>
    </ServiceReservationPanel>
  );
};

const PERIODS = [
  { key: 'manana', from: '00:00', to: '12:00' },
  { key: 'tarde', from: '12:00', to: '18:00' },
  { key: 'noche', from: '18:00', to: '24:00' },
] as const;
type PeriodKey = typeof PERIODS[number]['key'];

/** Hora legible (7:00 a. m. / 7:00 AM) a partir de HH:MM, sin conversión de zona horaria. */
const useSlotLabel = () => {
  const { locale } = usePublicInterface();
  const format = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
  return (time: string) => { const [h, m] = time.split(':').map(Number); return format.format(new Date(Date.UTC(1970, 0, 1, h, m))); };
};

/** Selector de franjas de 30 minutos agrupadas por momento del día. */
function MesaTimeSlots({
  fecha,
  value,
  onChange,
  disabled,
  disponibilidad,
  isLoading,
}: {
  fecha: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  disponibilidad?: DisponibilidadMesaResponse;
  isLoading?: boolean;
}) {
  const t = usePublicTexts('restaurante');
  const { locale } = usePublicInterface();
  const label = useSlotLabel();
  const labelId = useId();
  const slots = mesaSlotsFor(fecha);
  const inPeriod = (key: PeriodKey) => { const period = PERIODS.find((item) => item.key === key)!; return slots.filter((slot) => slot >= period.from && slot < period.to); };
  const selected = value.slice(0, 5);
  const initial = (PERIODS.find((period) => selected && selected >= period.from && selected < period.to) ?? PERIODS.find((period) => inPeriod(period.key).length) ?? PERIODS[0]).key;
  const [period, setPeriod] = useState<PeriodKey>(initial);
  // Si el periodo elegido se queda sin franjas (p. ej. hoy por la tarde), se pasa al siguiente con horarios.
  useEffect(() => { if (!inPeriod(period).length) setPeriod((PERIODS.find((item) => inPeriod(item.key).length) ?? PERIODS[0]).key); }, [fecha]);
  const visible = inPeriod(period);

  return <div className="space-y-2" role="group" aria-labelledby={labelId}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
      <p id={labelId} className="text-xs font-semibold text-neutro-700">{t.horaLabel}</p>
      <p className="text-xs text-neutro-500">{t.horarioAtencion(label(RESTAURANT_BOOKING_HOURS.apertura), label(RESTAURANT_BOOKING_HOURS.cierre))} · {locale === 'en' ? 'Duration' : 'Duración'} {RESTAURANT_BOOKING_HOURS.duracionMinutos} min</p>
    </div>
    {slots.length === 0 ? <p role="status" className="rounded-md border border-neutro-200 bg-neutro-50 p-3 text-sm text-neutro-700">{t.sinHorariosHoy}</p> : <>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-neutro-100 p-1">
        {PERIODS.map((item) => { const count = inPeriod(item.key).length; return <button key={item.key} type="button" disabled={disabled || !count} aria-pressed={period === item.key} onClick={() => setPeriod(item.key)}
          className={`min-h-10 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${period === item.key ? 'bg-white text-bronce-800 shadow-sm' : 'text-neutro-700 hover:text-bronce-800'}`}>{t.franjas[item.key]}</button>; })}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {visible.map((slot) => {
          const slotInfo = disponibilidad?.slots.find((s) => s.hora === slot);
          const isOcupado = slotInfo?.ocupada ?? false;
          const isPasado = slotInfo ? slotInfo.pasada : false;
          const isBotonDeshabilitado = disabled || isOcupado || isPasado || isLoading;
          const slotLabel = label(slot);
          return (
            <button
              key={slot}
              type="button"
              disabled={isBotonDeshabilitado}
              aria-pressed={selected === slot}
              aria-label={isOcupado ? `${slotLabel} (${t.estadosMesa.ocupada ?? 'Ocupada'})` : slotLabel}
              title={isOcupado ? (t.estadosMesa.ocupada ?? 'Horario ocupado por otra reserva') : undefined}
              onClick={() => onChange(slot)}
              className={`min-h-11 rounded-md border px-2 text-sm font-medium transition-colors flex flex-col items-center justify-center py-1 ${
                selected === slot
                  ? 'border-bronce-600 bg-bronce-600 text-white'
                  : isOcupado
                  ? 'border-neutro-200 bg-neutro-100 text-neutro-400 cursor-not-allowed line-through'
                  : 'border-neutro-300 bg-white text-neutro-800 hover:border-bronce-500 disabled:cursor-not-allowed disabled:opacity-50'
              }`}
            >
              <span>{slotLabel}</span>
              {isOcupado && (
                <span className="block text-[10px] uppercase tracking-wider font-semibold no-underline text-error-600/90 leading-tight">
                  {t.estadosMesa.ocupada ? 'Ocupada' : 'Ocupado'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>}
  </div>;
}

/** Número de comensales entre 1 y la capacidad real de la mesa. */
function PartySize({ value, max, onChange, disabled }: { value: number; max: number; onChange: (value: number) => void; disabled?: boolean }) {
  const t = usePublicTexts('restaurante');
  const id = useId();
  const invalid = !Number.isSafeInteger(value) || value < 1 || value > max;
  return <div className="space-y-2">
    <p id={id} className="text-xs font-semibold text-neutro-700">{t.comensalesLabel}</p>
    <div className="flex items-center gap-3" role="group" aria-labelledby={id}>
      <div className="flex items-center rounded-md border border-neutro-300 bg-white p-1">
        <Button type="button" variant="ghost" size="sm" aria-label={t.menosComensales} disabled={disabled || value <= 1} onClick={() => onChange(Math.max(1, value - 1))}><Minus className="size-4" aria-hidden="true" /></Button>
        <output aria-live="polite" className="min-w-10 text-center text-base font-semibold text-neutro-900">{value}</output>
        <Button type="button" variant="ghost" size="sm" aria-label={t.masComensales} disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Plus className="size-4" aria-hidden="true" /></Button>
      </div>
      <span className="text-sm text-neutro-600">{t.capacidadPersonas(value)}</span>
    </div>
    {invalid ? <p role="alert" className="text-xs text-error-600">{t.errorCapacidad}</p> : <p className="text-xs text-neutro-500">{t.comensalesMax(max)}</p>}
  </div>;
}
