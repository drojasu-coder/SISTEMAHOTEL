import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { useAuth } from "@/features/auth/AuthContext";
import { useCreateReservaMesaMutation } from "../hooks/useReservasMesa";
import { textosRestaurante } from "../textos";
import { RESTAURANTE_ROUTES } from "../constants/routes";
import type { MesaConSucursal, ReservaMesa } from "../types";
import { ApiError } from "@/api/client/http";
import { CheckCircle2, Calendar, Clock, Users, ArrowRight } from "lucide-react";

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
  const { status, user } = useAuth();
  const navigate = useNavigate();
  const createMutation = useCreateReservaMesaMutation();
  const t = textosRestaurante;

  const isCliente = status === "authenticated" && user?.rol === "cliente";

  const [fecha, setFecha] = useState<string>(getTodayDateString());
  const [hora, setHora] = useState<string>("13:00");
  const [comensales, setComensales] = useState<number>(2);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [reservaConfirmada, setReservaConfirmada] = useState<ReservaMesa | null>(null);

  const handleClose = () => {
    setErrorLocal(null);
    setReservaConfirmada(null);
    onClose();
  };

  if (!mesa) return null;

  const capacidadMaxima = mesa.capacidad || 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCliente) return;

    setErrorLocal(null);

    if (comensales > capacidadMaxima) {
      setErrorLocal(t.errorCapacidad);
      return;
    }

    if (comensales < 1) {
      setErrorLocal("El número de comensales debe ser de al menos 1 persona.");
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
          setErrorLocal(t.errorMesaOcupada);
        } else if (err.code === "TABLE_IN_MAINTENANCE") {
          setErrorLocal(t.errorMesaMantenimiento);
        } else if (err.code === "TABLE_CAPACITY_EXCEEDED") {
          setErrorLocal(t.errorCapacidad);
        } else if (err.code === "TABLE_RESERVATION_DATE_IN_PAST") {
          setErrorLocal(t.errorFechaPasada);
        } else if (err.code === "TABLE_RESERVATION_TIME_IN_PAST") {
          setErrorLocal(t.errorHoraPasada);
        } else {
          setErrorLocal(err.message || "Error al registrar la reserva.");
        }
      } else {
        setErrorLocal(t.falloConexionIncierto);
      }
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
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
                  {mesa.Sucursal?.nombre || `Sede #${mesa.sucursal_id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-600">{t.cliente.mesa}:</span>
                <span className="font-medium text-neutro-900">
                  Mesa #{mesa.id} ({mesa.zona})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-600">{t.cliente.fecha}:</span>
                <span className="font-medium text-neutro-900">{reservaConfirmada.fecha}</span>
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
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-verde-100 text-verde-800">
                  {t.cliente.estados.confirmada}
                </span>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorLocal && (
              <Alert tone="error">
                <span className="text-sm">{errorLocal}</span>
              </Alert>
            )}

            <div className="rounded-md bg-neutro-50 p-3 border border-neutro-200 text-xs text-neutro-600">
              <p>{t.avisoDisponibilidad}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutro-700 uppercase tracking-wide">
                  {t.sedeLabel}
                </label>
                <div className="mt-1 flex items-center gap-2 rounded-md border border-neutro-200 bg-neutro-100 px-3 py-2 text-sm text-neutro-900">
                  <span>{mesa.Sucursal?.nombre || `Sede #${mesa.sucursal_id}`}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutro-700 uppercase tracking-wide">
                  {t.mesaLabel}
                </label>
                <div className="mt-1 flex items-center gap-2 rounded-md border border-neutro-200 bg-neutro-100 px-3 py-2 text-sm text-neutro-900">
                  <span>Mesa #{mesa.id} — {mesa.zona} ({t.comensalesMax(capacidadMaxima)})</span>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="reserva-fecha"
                className="block text-xs font-semibold text-neutro-700 uppercase tracking-wide"
              >
                {t.fechaLabel}
              </label>
              <div className="relative mt-1">
                <input
                  id="reserva-fecha"
                  type="date"
                  min={getTodayDateString()}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  disabled={createMutation.isPending}
                  className="w-full rounded-md border border-neutro-300 px-3 py-2 text-sm text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
                />
                <Calendar className="pointer-events-none absolute right-3 top-2.5 size-4 text-neutro-400" aria-hidden="true" />
              </div>
            </div>

            <div>
              <label
                htmlFor="reserva-hora"
                className="block text-xs font-semibold text-neutro-700 uppercase tracking-wide"
              >
                {t.horaLabel}
              </label>
              <div className="relative mt-1">
                <input
                  id="reserva-hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  required
                  disabled={createMutation.isPending}
                  className="w-full rounded-md border border-neutro-300 px-3 py-2 text-sm text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500 bg-blanco"
                />
                <Clock className="pointer-events-none absolute right-3 top-2.5 size-4 text-neutro-400" aria-hidden="true" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label
                  htmlFor="reserva-comensales"
                  className="block text-xs font-semibold text-neutro-700 uppercase tracking-wide"
                >
                  {t.comensalesLabel}
                </label>
                <span className="text-xs text-neutro-500">
                  {t.comensalesMax(capacidadMaxima)}
                </span>
              </div>
              <div className="relative mt-1">
                <select
                  id="reserva-comensales"
                  value={comensales}
                  onChange={(e) => setComensales(Number(e.target.value))}
                  required
                  disabled={createMutation.isPending}
                  className="w-full rounded-md border border-neutro-300 px-3 py-2 text-sm text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500 bg-blanco"
                >
                  {Array.from({ length: capacidadMaxima }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {t.capacidadPersonas(n)}
                    </option>
                  ))}
                </select>
                <Users className="pointer-events-none absolute right-3 top-2.5 size-4 text-neutro-400" aria-hidden="true" />
              </div>
            </div>

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
          </form>
        )}
      </div>
    </Modal>
  );
};
