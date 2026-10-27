import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";
import { useMisReservasMesaQuery } from "../hooks/useReservasMesa";
import { textosRestaurante } from "../textos";
import { RESTAURANTE_ROUTES } from "../constants/routes";
import { RESERVAS_ROUTES } from "@/features/reservas/constants/routes";
import { AMENIDADES_ROUTES } from "@/features/amenidades/constants/routes";
import { ACTIVIDADES_ROUTES } from "@/features/actividades/constants/routes";
import { Compass } from "lucide-react";
import {
  BedDouble,
  UtensilsCrossed,
  Sparkles,
  Calendar,
  Clock,
  Users,
  MapPin,
  AlertCircle,
  ArrowRight,
  Plus,
} from "lucide-react";

export const MisReservasRestauranteList: React.FC = () => {
  const { status, user } = useAuth();
  const t = textosRestaurante.cliente;

  const isCliente = status === "authenticated" && user?.rol === "cliente";
  const reservasQuery = useMisReservasMesaQuery(user?.id, isCliente);
  const reservas = reservasQuery.data ?? [];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Pestañas de navegación entre habitaciones, restaurante y amenidades */}
      <div className="flex border-b border-neutro-200">
        <Link
          to={RESERVAS_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors"
        >
          <BedDouble className="size-4" aria-hidden="true" />
          <span>{t.pestanaHabitaciones}</span>
        </Link>
        <Link
          to={RESTAURANTE_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-bronce-600 px-4 py-3 text-sm font-semibold text-bronce-700"
          aria-current="page"
        >
          <UtensilsCrossed className="size-4" aria-hidden="true" />
          <span>{t.pestanaRestaurante}</span>
        </Link>
        <Link
          to={AMENIDADES_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          <span>{t.pestanaAmenidades}</span>
        </Link>
        <Link
          to={ACTIVIDADES_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors"
        >
          <Compass className="size-4" aria-hidden="true" />
          <span>Actividades Recreativas</span>
        </Link>
      </div>

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{t.misReservasSubtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
            {t.misReservasTitulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {t.misReservasDescripcion}
          </p>
        </div>

        <Link
          to={RESTAURANTE_ROUTES.CATALOGO}
          className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors self-start sm:self-center"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>{textosRestaurante.reservarMesa}</span>
        </Link>
      </div>

      {/* Estado: Cargando */}
      {reservasQuery.isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="h-6 w-1/3 animate-pulse rounded bg-neutro-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-neutro-200" />
              <div className="h-10 w-full animate-pulse rounded bg-neutro-200" />
            </Card>
          ))}
        </div>
      )}

      {/* Estado: Error */}
      {reservasQuery.isError && !reservasQuery.isPending && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {t.errorCargarReservas}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            Ocurrió un inconveniente al consultar sus reservas gastronómicas.
          </p>
          <Button type="button" variant="primary" onClick={() => reservasQuery.refetch()}>
            {t.reintentar}
          </Button>
        </Card>
      )}

      {/* Estado: Vacío */}
      {!reservasQuery.isPending && !reservasQuery.isError && reservas.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <UtensilsCrossed className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {t.sinReservasTitulo}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            {t.sinReservasDesc}
          </p>
          <Link
            to={RESTAURANTE_ROUTES.CATALOGO}
            className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors"
          >
            <span>{t.explorarRestaurante}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Card>
      )}

      {/* Listado de Reservas */}
      {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reservas.map((reserva) => {
            const isCancelada = reserva.estado === "cancelada";
            const sedeNombre =
              reserva.Mesa?.Sucursal?.nombre || `Sede #${reserva.Mesa?.sucursal_id ?? ""}`;

            return (
              <Card
                key={reserva.id}
                className="flex flex-col justify-between p-6 transition-shadow hover:shadow-md border-neutro-200"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-bronce-700">
                          Reserva #{reserva.id}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            isCancelada
                              ? "bg-rojo-100 text-rojo-800"
                              : "bg-verde-100 text-verde-800"
                          }`}
                        >
                          {isCancelada ? t.estados.cancelada : t.estados.confirmada}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-neutro-900 mt-1">
                        Mesa #{reserva.mesa_id} — {reserva.Mesa?.zona || "Salón"}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-neutro-500 mt-0.5">
                        <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                        <span>{sedeNombre}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutro-100 text-xs text-neutro-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-bronce-600 shrink-0" aria-hidden="true" />
                      <span>{reserva.fecha}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-bronce-600 shrink-0" aria-hidden="true" />
                      <span>{reserva.hora} hrs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-bronce-600 shrink-0" aria-hidden="true" />
                      <span>{textosRestaurante.capacidadPersonas(reserva.numero_comensales)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-neutro-100 flex items-center justify-between">
                  <span className="text-xs text-neutro-500">
                    {t.pagoNota}
                  </span>
                  <Link
                    to={RESTAURANTE_ROUTES.DETALLE_RESERVA(reserva.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-bronce-700 hover:text-bronce-900 transition-colors"
                  >
                    <span>{t.verDetalle}</span>
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};
