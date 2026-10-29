import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { Alert, LoadingNotice } from "@/components/ui/Feedback";
import { getApiErrorMessage } from "@/api/errors";
import { useCancelarMiReservaMesaMutation, useMisReservasMesaQuery } from "../hooks/useReservasMesa";
import type { ReservaMesa } from "../types";
import { textosRestaurante } from "../textos";
import { RESTAURANTE_ROUTES } from "../constants/routes";
import { MisReservasLayout } from "@/features/mis-reservas/components/MisReservasLayout";
import {
  UtensilsCrossed,
  Calendar,
  Clock,
  Users,
  MapPin,
  Plus,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

/** Fecha y hora actuales del hotel (America/Guatemala) como "AAAA-MM-DD HH:MM:SS". */
const ahoraHotel = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guatemala",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`;
};

/** Solo orienta la interfaz: el servidor vuelve a validar estado, propietario y horario. */
const esCancelable = (reserva: ReservaMesa) => {
  const hora = reserva.hora.length === 5 ? `${reserva.hora}:00` : reserva.hora;
  return reserva.estado === "confirmada" && `${reserva.fecha} ${hora}` > ahoraHotel();
};

const estadoClases: Record<string, string> = {
  confirmada: "border-exito-600/20 bg-exito-50 text-exito-700",
  cancelada: "border-error-600/20 bg-error-50 text-error-700",
};

export const MisReservasRestauranteList: React.FC = () => {
  const { status, user } = useAuth();
  const t = textosRestaurante.cliente;

  const isCliente = status === "authenticated" && user?.rol === "cliente";
  const reservasQuery = useMisReservasMesaQuery(user?.id, isCliente);
  const reservas = reservasQuery.data ?? [];
  const cancelarMutation = useCancelarMiReservaMesaMutation();
  const [porCancelar, setPorCancelar] = useState<ReservaMesa | null>(null);
  const [errorCancelacion, setErrorCancelacion] = useState<string | null>(null);
  const [cancelada, setCancelada] = useState<number | null>(null);

  const cerrarConfirmacion = () => {
    if (cancelarMutation.isPending) return;
    setPorCancelar(null);
    setErrorCancelacion(null);
  };

  const confirmarCancelacion = async () => {
    if (!porCancelar) return;
    setErrorCancelacion(null);
    try {
      const resultado = await cancelarMutation.mutateAsync(porCancelar.id);
      setCancelada(resultado.id);
      setPorCancelar(null);
    } catch (err) {
      setErrorCancelacion(getApiErrorMessage(err));
    }
  };

  return (
    <MisReservasLayout>
      <div className="flex flex-col gap-6">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-serif font-semibold text-neutro-900 sm:text-2xl">
              {t.pestanaRestaurante}
            </h1>
            {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
              <p className="text-xs text-neutro-500">
                {reservas.length === 1 ? "1 reserva" : `${reservas.length} reservas`}
              </p>
            )}
          </div>
          <Link
            to={RESTAURANTE_ROUTES.CATALOGO}
            className="inline-flex items-center gap-2 self-start rounded-md bg-bronce-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-bronce-700 transition-colors sm:self-center"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>{textosRestaurante.reservarMesa}</span>
          </Link>
        </div>

        {/* Alerta de cancelación exitosa */}
        {cancelada !== null && (
          <Alert tone="success">{t.cancelacionExitosa(cancelada)}</Alert>
        )}

        {/* Cargando */}
        {reservasQuery.isPending && (
          <div className="flex justify-center py-12">
            <LoadingNotice label={t.cargandoReservas ?? "Cargando reservas…"} />
          </div>
        )}

        {/* Error */}
        {reservasQuery.isError && !reservasQuery.isPending && (
          <Card className="flex flex-col items-start gap-4">
            <Alert tone="error" title={t.errorCargarReservas}>
              {getApiErrorMessage(reservasQuery.error)}
            </Alert>
            <Button type="button" variant="ghost" onClick={() => reservasQuery.refetch()}>
              {t.reintentar}
            </Button>
          </Card>
        )}

        {/* Estado vacío */}
        {!reservasQuery.isPending && !reservasQuery.isError && reservas.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <UtensilsCrossed className="size-10 text-neutro-300" aria-hidden="true" />
            <div className="flex max-w-sm flex-col gap-1">
              <h2 className="text-base font-serif font-semibold text-neutro-800">
                {t.sinReservasTitulo}
              </h2>
              <p className="text-xs text-neutro-500">{t.sinReservasDesc}</p>
            </div>
            <Link
              to={RESTAURANTE_ROUTES.CATALOGO}
              className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-bronce-700 transition-colors"
            >
              <span>{t.explorarRestaurante}</span>
            </Link>
          </Card>
        )}

        {/* Listado */}
        {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {reservas.map((reserva) => {
              const sedeNombre =
                reserva.Mesa?.Sucursal?.nombre || `Sede #${reserva.Mesa?.sucursal_id ?? ""}`;
              const estadoKey = reserva.estado as string;

              return (
                <article
                  key={reserva.id}
                  className="surface flex flex-col gap-3 p-4 transition-shadow hover:shadow-md"
                >
                  {/* Cabecera */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-bronce-700">
                        Reserva #{reserva.id}
                      </p>
                      <h2 className="truncate text-sm font-semibold text-neutro-900">
                        Mesa #{reserva.mesa_id}
                        {reserva.Mesa?.zona ? ` — ${reserva.Mesa.zona}` : ""}
                      </h2>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        estadoClases[estadoKey] ?? "border-neutro-200 bg-neutro-100 text-neutro-700",
                      )}
                    >
                      {t.estados[estadoKey as keyof typeof t.estados] ?? estadoKey}
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
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 shrink-0 text-neutro-400" aria-hidden="true" />
                      <dt className="sr-only">Hora</dt>
                      <dd>{reserva.hora} hrs</dd>
                      <Users className="ml-2 size-3.5 shrink-0 text-neutro-400" aria-hidden="true" />
                      <dt className="sr-only">Comensales</dt>
                      <dd>{textosRestaurante.capacidadPersonas(reserva.numero_comensales)}</dd>
                    </div>
                  </dl>

                  {/* Pie: acción secundaria + detalle */}
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-neutro-100 pt-3">
                    {esCancelable(reserva) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-error-700 hover:bg-error-50"
                        onClick={() => {
                          setCancelada(null);
                          setErrorCancelacion(null);
                          setPorCancelar(reserva);
                        }}
                      >
                        {t.cancelarReserva}
                      </Button>
                    ) : (
                      <span />
                    )}
                    <Link
                      to={RESTAURANTE_ROUTES.DETALLE_RESERVA(reserva.id)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-bronce-700 hover:text-bronce-900 transition-colors"
                    >
                      <span>{t.verDetalle}</span>
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de cancelación */}
      <Modal
        open={porCancelar !== null}
        onClose={cerrarConfirmacion}
        title={t.cancelarTitulo}
        busy={cancelarMutation.isPending}
        busyLabel={t.cancelando}
      >
        {porCancelar && (
          <div className="space-y-4">
            <p className="text-sm text-neutro-700">
              {t.cancelarDescripcion(porCancelar.id, porCancelar.fecha, porCancelar.hora)}
            </p>
            {errorCancelacion && <Alert tone="error">{errorCancelacion}</Alert>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={cerrarConfirmacion}
                disabled={cancelarMutation.isPending}
              >
                {t.cancelarVolver}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => void confirmarCancelacion()}
                disabled={cancelarMutation.isPending}
              >
                {cancelarMutation.isPending ? t.cancelando : t.cancelarConfirmar}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MisReservasLayout>
  );
};
