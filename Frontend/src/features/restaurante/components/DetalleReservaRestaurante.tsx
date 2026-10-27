import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";
import { useMiReservaMesaDetalleQuery } from "../hooks/useReservasMesa";
import { textosRestaurante } from "../textos";
import { RESTAURANTE_ROUTES } from "../constants/routes";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  UtensilsCrossed,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const DetalleReservaRestaurante: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = id ? parseInt(id, 10) : NaN;
  const { status, user } = useAuth();
  const t = textosRestaurante.cliente;

  const isCliente = status === "authenticated" && user?.rol === "cliente";
  const reservaQuery = useMiReservaMesaDetalleQuery(numericId, user?.id, isCliente);
  const reserva = reservaQuery.data;

  if (isNaN(numericId) || numericId <= 0) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h1 className="text-xl font-bold text-neutro-900 mb-2">Identificador inválido</h1>
          <p className="text-sm text-neutro-600 mb-6">
            El identificador proporcionado para la reserva no es válido.
          </p>
          <Link
            to={RESTAURANTE_ROUTES.MIS_RESERVAS}
            className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t.volverMisReservas}</span>
          </Link>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      {/* Botón Volver */}
      <div>
        <Link
          to={RESTAURANTE_ROUTES.MIS_RESERVAS}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutro-600 hover:text-neutro-900 transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t.volverMisReservas}</span>
        </Link>
      </div>

      {/* Estado: Cargando */}
      {reservaQuery.isLoading && (
        <Card className="p-8 space-y-6" aria-busy="true">
          <div className="h-8 w-1/3 animate-pulse rounded bg-neutro-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-neutro-200" />
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="h-16 w-full animate-pulse rounded bg-neutro-200" />
            <div className="h-16 w-full animate-pulse rounded bg-neutro-200" />
          </div>
        </Card>
      )}

      {/* Estado: Error o No encontrado */}
      {(reservaQuery.isError || (!reservaQuery.isLoading && !reserva)) && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h1 className="text-xl font-bold text-neutro-900 mb-2">{t.errorCargarReservas}</h1>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            {t.reservaNoEncontrada}
          </p>
          <div className="flex gap-4">
            <Button type="button" variant="secondary" onClick={() => reservaQuery.refetch()}>
              {t.reintentar}
            </Button>
            <Link
              to={RESTAURANTE_ROUTES.MIS_RESERVAS}
              className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors"
            >
              <span>{t.volverMisReservas}</span>
            </Link>
          </div>
        </Card>
      )}

      {/* Detalle de la Reserva */}
      {!reservaQuery.isLoading && reserva && (
        <Card className="p-8 space-y-8 border-neutro-200 shadow-sm">
          {/* Cabecera */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutro-200">
            <div>
              <p className="eyebrow">{t.detalleSubtitulo}</p>
              <h1 className="text-2xl font-bold text-neutro-900 font-serif">
                {t.detalleTitulo} #{reserva.id}
              </h1>
            </div>
            <div>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${
                  reserva.estado === "cancelada"
                    ? "bg-error-50 text-error-700 border-error-600/20"
                    : "bg-exito-50 text-exito-700 border-exito-600/20"
                }`}
              >
                {reserva.estado === "cancelada"
                  ? t.estados.cancelada
                  : t.estados.confirmada}
              </span>
            </div>
          </div>

          {/* Información principal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-lg bg-neutro-50 p-4 border border-neutro-200 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutro-500">
                {t.sede}
              </span>
              <p className="text-base font-bold text-neutro-900 flex items-center gap-1.5 mt-1">
                <MapPin className="size-4 text-bronce-600 shrink-0" aria-hidden="true" />
                <span>
                  {reserva.Mesa?.Sucursal?.nombre || `Sede #${reserva.Mesa?.sucursal_id ?? ""}`}
                </span>
              </p>
              {reserva.Mesa?.Sucursal?.direccion && (
                <p className="text-xs text-neutro-600 pl-5">
                  {reserva.Mesa.Sucursal.direccion}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-neutro-50 p-4 border border-neutro-200 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutro-500">
                {t.mesa}
              </span>
              <p className="text-base font-bold text-neutro-900 flex items-center gap-1.5 mt-1">
                <UtensilsCrossed className="size-4 text-bronce-600 shrink-0" aria-hidden="true" />
                <span>Mesa #{reserva.mesa_id}</span>
              </p>
              <p className="text-xs text-neutro-600 pl-5">
                Zona: {reserva.Mesa?.zona || "Salón principal"}
              </p>
            </div>

            <div className="rounded-lg bg-neutro-50 p-4 border border-neutro-200 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutro-500">
                {t.fecha} y {t.hora}
              </span>
              <p className="text-base font-bold text-neutro-900 flex items-center gap-1.5 mt-1">
                <Calendar className="size-4 text-bronce-600 shrink-0" aria-hidden="true" />
                <span>{reserva.fecha}</span>
              </p>
              <p className="text-xs text-neutro-600 flex items-center gap-1 pl-5">
                <Clock className="size-3.5 text-neutro-500" aria-hidden="true" />
                <span>{reserva.hora} hrs</span>
              </p>
            </div>

            <div className="rounded-lg bg-neutro-50 p-4 border border-neutro-200 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutro-500">
                {t.personas}
              </span>
              <p className="text-base font-bold text-neutro-900 flex items-center gap-1.5 mt-1">
                <Users className="size-4 text-bronce-600 shrink-0" aria-hidden="true" />
                <span>
                  {textosRestaurante.capacidadPersonas(reserva.numero_comensales)}
                </span>
              </p>
              <p className="text-xs text-neutro-600 pl-5">
                Capacidad de mesa: {reserva.Mesa?.capacidad || 4} comensales
              </p>
            </div>
          </div>

          {/* Estado y Políticas */}
          <div className="rounded-lg border border-exito-600/20 bg-exito-50 p-4 text-sm text-exito-700 flex items-start gap-3">
            {reserva.estado === "confirmada" ? (
              <CheckCircle2 className="size-5 text-exito-700 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <XCircle className="size-5 text-error-600 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div>
              <p className="font-semibold">
                Estado:{" "}
                {reserva.estado === "cancelada"
                  ? t.estados.cancelada
                  : t.estados.confirmada}
              </p>
              <p className="text-xs mt-1">{t.pagoNota}</p>
            </div>
          </div>

          {/* Enlace de regreso */}
          <div className="pt-4 border-t border-neutro-200 flex justify-end">
            <Link
              to={RESTAURANTE_ROUTES.MIS_RESERVAS}
              className="inline-flex items-center gap-2 rounded-md border border-neutro-300 bg-white px-4 py-2 text-sm font-medium text-neutro-700 shadow-sm hover:bg-neutro-50 transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>{t.volverMisReservas}</span>
            </Link>
          </div>
        </Card>
      )}
    </section>
  );
};
