import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';
import { Select } from '@/components/ui/Select';
import { TranslatedError, type LocalizedError } from '@/i18n/public';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { useDraftSiteGuard, DraftSiteNotice } from '@/features/preferencias/SiteContextNotice';
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { useAuth } from "@/features/auth/AuthContext";
import { useCreateReservaMesaMutation } from "../hooks/useReservasMesa";

import { RESTAURANTE_ROUTES } from "../constants/routes";
import type { MesaConSucursal, ReservaMesa } from "../types";
import { ApiError } from "@/api/client/http";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface ReservaMesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesa: MesaConSucursal | null;
}

const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

  const [fecha, setFecha] = useState<string>(getTodayDateString());
  const [hora, setHora] = useState<string>("13:00");
  const [comensales, setComensales] = useState<number>(2);
  const [errorLocal, setErrorLocal] = useState<LocalizedError | null>(null);
  const [reservaConfirmada, setReservaConfirmada] = useState<ReservaMesa | null>(null);

  const handleClose = () => {
    if (createMutation.isPending) return;
    setErrorLocal(null);
    setReservaConfirmada(null);
    onClose();
  };

  if (!mesa) return null;

  const capacidadMaxima = mesa.capacidad || 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCliente || createMutation.isPending) return;

    setErrorLocal(null);

    if (comensales > capacidadMaxima) {
      setErrorLocal({ section: 'restaurante', key: 'errorCapacidad' });
      return;
    }

    if (comensales < 1) {
      setErrorLocal({ section: 'extra', key: 'minimumDiners' });
      return;
    }

    try {
      const payload = {
        mesa_id: mesa.id,
        fecha,
        hora,
        numero_comensales: comensales,
      };

      const resultado = await createMutation.mutateAsync(payload);
      setReservaConfirmada(resultado);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
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
      } else {
        setErrorLocal({ section: 'restaurante', key: 'falloConexionIncierto' });
      }
    }
  };

  return (
    <Modal
      busy={createMutation.isPending}
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
                  {t.cliente.pagoNota}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-neutro-200 bg-neutro-50 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-neutro-600">{t.cliente.sede}:</span>
                <span className="font-medium text-neutro-900">
                  <span lang="es">{mesa.Sucursal?.nombre || p('siteName')}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-600">{t.cliente.mesa}:</span>
                <span className="font-medium text-neutro-900">
                  {p('table')} #{mesa.id} (<span lang="es">{mesa.zona}</span>)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-600">{calendarDate(t.cliente.fecha)}:</span>
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
        ) : !isCliente ? (
          <div className="space-y-4">
            <Alert tone="warning">
              <p className="text-sm">{t.debeIniciarSesion}</p>
            </Alert>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={handleClose}>
                {t.cerrar}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  handleClose();
                  navigate("/login?redirect=/restaurante");
                }}
              >
                {t.iniciarSesionParaReservar}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={(event) => { if (siteBlocked) { event.preventDefault(); return; } void handleSubmit(event); }} className="space-y-4">
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
                  <span><span lang="es">{mesa.Sucursal?.nombre || p('siteName')}</span></span>
                </div>
              </div>
              <div>
                <p className="block text-xs font-semibold text-neutro-700 uppercase tracking-wide">
                  {t.mesaLabel}
                </p>
                <div className="mt-1 flex items-center gap-2 rounded-md border border-neutro-200 bg-neutro-100 px-3 py-2 text-sm text-neutro-900">
                  <span>{p('table')} — <span lang="es">{mesa.zona}</span> ({t.comensalesMax(capacidadMaxima)})</span>
                </div>
              </div>
            </div>

            <DateField label={t.fechaLabel} id="reserva-fecha" min={getTodayDateString()} value={fecha} onChange={(e) => setFecha(e.target.value)} required disabled={createMutation.isPending} />
            <TimeField label={t.horaLabel} id="reserva-hora" value={hora} onChange={(e) => setHora(e.target.value)} required disabled={createMutation.isPending} />
            <Select label={t.comensalesLabel} hint={t.comensalesMax(capacidadMaxima)} id="reserva-comensales" value={comensales} onChange={(e) => setComensales(Number(e.target.value))} required disabled={createMutation.isPending}>
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
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? t.confirmando : t.confirmarReserva}
              </Button>
            </div>
          </fieldset></form>
        )}
      </div>
    </Modal>
  );
};
