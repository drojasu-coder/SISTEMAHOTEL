import React from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  UtensilsCrossed,
  Sparkles,
  Compass,
  Heart,
  Plus,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { useMisCitasSpaQuery } from '../hooks/useBienestar';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { RESTAURANTE_ROUTES } from '@/features/restaurante';
import { AMENIDADES_ROUTES } from '@/features/amenidades';
import { ACTIVIDADES_ROUTES } from '@/features/actividades/constants/routes';
import { BIENESTAR_ROUTES } from '../constants/routes';
import { textosBienestar, formatearGTQ } from '../textos';
import { BotonAnadirAlCarrito } from '@/features/carrito/components/BotonAnadirAlCarrito';

export const MisCitasSpaList: React.FC = () => {
  const { user } = useAuth();
  const citasQuery = useMisCitasSpaQuery(user?.id);
  const citas = citasQuery.data ?? [];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Pestañas de navegación de Mis Reservas */}
      <div className="flex border-b border-neutro-200 overflow-x-auto">
        <Link
          to={RESERVAS_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <BedDouble className="size-4" aria-hidden="true" />
          <span>{textosBienestar.pestanaHabitaciones}</span>
        </Link>
        <Link
          to={RESTAURANTE_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <UtensilsCrossed className="size-4" aria-hidden="true" />
          <span>{textosBienestar.pestanaRestaurante}</span>
        </Link>
        <Link
          to={AMENIDADES_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          <span>{textosBienestar.pestanaAmenidades}</span>
        </Link>
        <Link
          to={ACTIVIDADES_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <Compass className="size-4" aria-hidden="true" />
          <span>{textosBienestar.pestanaActividades}</span>
        </Link>
        <Link
          to={BIENESTAR_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-bronce-600 px-4 py-3 text-sm font-semibold text-bronce-700 whitespace-nowrap"
          aria-current="page"
        >
          <Heart className="size-4" aria-hidden="true" />
          <span>{textosBienestar.pestanaBienestar}</span>
        </Link>
      </div>

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosBienestar.misReservasSubtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
            {textosBienestar.misReservasTitulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {textosBienestar.misReservasDescripcion}
          </p>
        </div>

        <Link
          to={BIENESTAR_ROUTES.CATALOGO}
          className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors self-start sm:self-center"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>{textosBienestar.reservarCita}</span>
        </Link>
      </div>

      {/* Estado: Cargando */}
      {citasQuery.isPending && (
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
      {citasQuery.isError && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {textosBienestar.errorCargarReservas}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            Ocurrió un inconveniente al consultar sus citas de spa.
          </p>
          <Button type="button" variant="primary" onClick={() => citasQuery.refetch()}>
            {textosBienestar.reintentar}
          </Button>
        </Card>
      )}

      {/* Estado: Vacío */}
      {!citasQuery.isPending && !citasQuery.isError && citas.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Heart className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {textosBienestar.sinCitasTitulo}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            {textosBienestar.sinCitasDesc}
          </p>
          <Link
            to={BIENESTAR_ROUTES.CATALOGO}
            className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors"
          >
            <span>{textosBienestar.explorarCatalogo}</span>
          </Link>
        </Card>
      )}

      {/* Lista de Citas */}
      {!citasQuery.isPending && !citasQuery.isError && citas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {citas.map((cita) => {
            const estadoClases =
              cita.estado === 'confirmada'
                ? 'bg-selva-100 text-selva-800'
                : cita.estado === 'cancelada'
                ? 'bg-rojo-100 text-rojo-800'
                : 'bg-neutro-100 text-neutro-800';

            return (
              <Card
                key={cita.id}
                className="flex flex-col justify-between p-6 transition-all hover:border-neutro-300 hover:shadow-soft"
              >
                <div className="space-y-4">
                  {/* Encabezado de la tarjeta */}
                  <div className="flex items-start justify-between gap-2 border-b border-neutro-100 pb-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutro-500">
                        {textosBienestar.citaNumero(cita.id ?? '')}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-neutro-900">
                        {cita.ServicioBienestar?.nombre ?? 'Servicio de bienestar'}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${estadoClases}`}
                    >
                      {cita.estado}
                    </span>
                  </div>

                  {/* Detalles */}
                  <div className="space-y-2 text-sm text-neutro-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-neutro-400" />
                      <span>{cita.fecha}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-neutro-400" />
                      <span>
                        {cita.hora_inicio} - {cita.hora_fin}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="size-4 text-neutro-400" />
                      <span>{cita.Terapeuta?.nombre ?? 'Terapeuta asignado'}</span>
                    </div>

                    {cita.ServicioBienestar?.precio !== undefined && (
                      <div className="pt-2 flex justify-between items-center text-sm font-semibold">
                        <span className="text-neutro-600">{textosBienestar.tarifaServicio}</span>
                        <span className="text-base text-bronce-700">
                          {formatearGTQ(cita.ServicioBienestar.precio)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-6 border-t border-neutro-100 mt-4 flex flex-col gap-3">
                  {cita.id && (
                    <BotonAnadirAlCarrito
                      reservaId={cita.id}
                      reservaEstado={cita.estado ?? 'confirmada'}
                      tipo_item="bienestar"
                      variant="primary"
                      className="w-full justify-center"
                    />
                  )}

                  <Link
                    to={BIENESTAR_ROUTES.DETALLE(cita.id ?? '')}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-neutro-300 bg-white px-4 py-2 text-sm font-medium text-neutro-700 hover:bg-neutro-50 transition-colors"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                    <span>Ver detalle completo</span>
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
