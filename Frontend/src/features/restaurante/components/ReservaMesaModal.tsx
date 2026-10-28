import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';
import { Select } from '@/components/ui/Select';
import { TranslatedError, type LocalizedError } from '@/i18n/public';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { useDraftSiteGuard, DraftSiteNotice } from '@/features/preferencias/SiteContextNotice';
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ServiceReservationPanel, ServiceAuthNotice } from '@/components/shared/ServiceReservationPanel';
import { useServiceDraft } from '@/features/auth/serviceDraft';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button, buttonStyles } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { useAuth } from "@/features/auth/AuthContext";
import { useCreateReservaMesaMutation } from "../hooks/useReservasMesa";

import { RESTAURANTE_ROUTES } from "../constants/routes";
import type { MesaConSucursal, ReservaMesa } from "../types";
import { ApiError } from "@/api/client/http";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { validateMesaReservation, normalizeMesaTime, validMesaReservationFields, type MesaReservationFields } from '../reservationValidation';
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

  useEffect(() => { if (mesa && !reservaConfirmada) draft.save({ fecha, hora, comensales }); }, [mesa?.id, fecha, hora, comensales, reservaConfirmada, draft.save]);

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
      if (err.code === "TABLE_UNAVAILABLE") {
        setErrorLocal({ section: 'restaurante', key: 'errorMesaOcupada' });
      } else if (err.code === "TABLE_IN_MAINTENANCE") {
        setErrorLocal({ section: 'restaurante', key: 'errorMesaMantenimiento' });
      } else if (err.code === "TABLE_CAPACITY_EXCEEDED") {
        setErrorLocal({ section: 'restaurante', key: 'errorCapacidad' });
      } else if (err.code === "TABLE_RESERVATION_DATE_IN_PAST") {
        setErrorLocal({ section: 'restaurante', key: 'errorFechaPasada' });
      } else if (err.code === "TABLE_RESERVATION_TIME_IN_PAST") {
        setErrorLocal({ section: 'restaurante', key: 'errorHoraPasada' });
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
                  handleClose();
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
                  handleClose();
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

            <div className="rounded-md bg-neutro-50 p-3 border border-neutro-200 text-xs text-neutro-600">
              <p>{t.avisoDisponibilidad}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="block text-xs font-semibold text-neutro-700 uppercase tracking-wide">
                  {t.sedeLabel}
                </p>
                <div className="mt-1 flex items-center gap-2 rounded-md border border-neutro-200 bg-neutro-100 px-3 py-2 text-sm text-neutro-900">
                  <span><span lang="es">{site?.nombre || mesa.Sucursal?.nombre || (mesa.sucursal_id ? `#${mesa.sucursal_id}` : p('siteName'))}</span></span>
                </div>
              </div>
              <div>
                <p className="block text-xs font-semibold text-neutro-700 uppercase tracking-wide">
                  {t.mesaLabel}
                </p>
                <div className="mt-1 flex items-center gap-2 rounded-md border border-neutro-200 bg-neutro-100 px-3 py-2 text-sm text-neutro-900">
                  <span>{p('table')} #{mesa.id} — <span lang="es">{mesa.zona}</span> ({t.comensalesMax(capacidadMaxima)})</span>
                </div>
              </div>
            </div>

            <DateField label={t.fechaLabel} id="reserva-fecha" min={getTodayInGuatemala()} value={fecha} onChange={(e) => setFecha(e.target.value)} required disabled={createMutation.isPending || Boolean(uncertain)} />
            <TimeField label={t.horaLabel} hint={t.ayudaHora} id="reserva-hora" value={hora} onChange={(e) => setHora(e.target.value)} required disabled={createMutation.isPending || Boolean(uncertain)} />
            <Select label={t.comensalesLabel} hint={t.comensalesMax(capacidadMaxima)} id="reserva-comensales" value={comensales} onChange={(e) => setComensales(Number(e.target.value))} required disabled={createMutation.isPending || Boolean(uncertain)}>
              {Array.from({ length: capacidadMaxima }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{t.capacidadPersonas(n)}</option>)}
            </Select>

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
