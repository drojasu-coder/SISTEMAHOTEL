import React from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  UtensilsCrossed,
  Sparkles,
  Compass,
  Plus,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, buttonStyles } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { useMisReservasActividadQuery } from '../hooks/useReservasActividad';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { RESTAURANTE_ROUTES } from '@/features/restaurante';
import { AMENIDADES_ROUTES } from '@/features/amenidades';
import { ACTIVIDADES_ROUTES } from '../constants/routes';
import { BIENESTAR_ROUTES } from '@/features/bienestar';
import { Heart } from 'lucide-react';
import { textosActividades, formatearGTQ } from '../textos';
import { BotonAnadirAlCarrito } from '@/features/carrito/components/BotonAnadirAlCarrito';

export const MisReservasActividadesList: React.FC = () => {
  const { user } = useAuth();
  const reservasQuery = useMisReservasActividadQuery(user?.id);
  const reservas = reservasQuery.data ?? [];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Pestañas de navegación de Mis Reservas */}
      <div className="flex border-b border-neutro-200 overflow-x-auto">
        <Link
          to={RESERVAS_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <BedDouble className="size-4" aria-hidden="true" />
          <span>{textosActividades.pestanaHabitaciones}</span>
        </Link>
        <Link
          to={RESTAURANTE_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <UtensilsCrossed className="size-4" aria-hidden="true" />
          <span>{textosActividades.pestanaRestaurante}</span>
        </Link>
        <Link
          to={AMENIDADES_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          <span>{textosActividades.pestanaAmenidades}</span>
        </Link>
        <Link
          to={ACTIVIDADES_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-bronce-600 px-4 py-3 text-sm font-semibold text-bronce-700 whitespace-nowrap"
          aria-current="page"
        >
          <Compass className="size-4" aria-hidden="true" />
          <span>{textosActividades.pestanaActividades}</span>
        </Link>
        <Link
          to={BIENESTAR_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <Heart className="size-4" aria-hidden="true" />
          <span>Bienestar y Spa</span>
        </Link>
      </div>

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosActividades.misReservasSubtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
            {textosActividades.misReservasTitulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {textosActividades.misReservasDescripcion}
          </p>
        </div>

        <Link
          to={ACTIVIDADES_ROUTES.CATALOGO}
          className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors self-start sm:self-center"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>{textosActividades.reservarActividad}</span>
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
      {reservasQuery.isError && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {textosActividades.errorCargarReservas}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            Ocurrió un inconveniente al consultar sus reservas recreativas.
          </p>
          <Button type="button" variant="primary" onClick={() => reservasQuery.refetch()}>
            {textosActividades.reintentar}
          </Button>
        </Card>
      )}

      {/* Estado: Vacío */}
      {!reservasQuery.isPending && !reservasQuery.isError && reservas.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Compass className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {textosActividades.sinReservasTitulo}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            {textosActividades.sinReservasDesc}
          </p>
          <Link
            to={ACTIVIDADES_ROUTES.CATALOGO}
            className={buttonStyles({ variant: 'primary' })}
          >
            {textosActividades.reservarActividad}
          </Link>
        </Card>
      )}

      {/* Listado de reservas */}
      {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reservas.map((reserva) => {
            const estadoClave = reserva.estado || 'confirmada';
            const estadoTexto = textosActividades.estados[estadoClave] || estadoClave;

            const estadoBadgeColor =
              estadoClave === 'confirmada'
                ? 'bg-verde-100 text-verde-800'
                : estadoClave === 'completada'
                  ? 'bg-azul-100 text-azul-800'
                  : 'bg-neutro-100 text-neutro-800';

            return (
              <Card
                key={reserva.id}
                className="flex flex-col justify-between p-6 border-neutro-200 hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-neutro-500">
                        Reserva #{reserva.id}
                      </span>
                      <h3 className="text-lg font-serif font-semibold text-neutro-900">
                        {reserva.RecursoActividad?.nombre || `Actividad #${reserva.recurso_id}`}
                      </h3>
                      {reserva.RecursoActividad?.tipo && (
                        <p className="text-xs text-neutro-500 uppercase tracking-wider font-medium">
                          {reserva.RecursoActividad.tipo}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${estadoBadgeColor}`}
                    >
                      {estadoTexto}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-neutro-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-neutro-400 shrink-0" aria-hidden="true" />
                      <span>{reserva.fecha}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-neutro-400 shrink-0" aria-hidden="true" />
                      <span>
                        {reserva.hora_inicio?.slice(0, 5)} - {reserva.hora_fin?.slice(0, 5)}
                      </span>
                    </div>

                    {reserva.RecursoActividad?.Sucursal?.nombre && (
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-neutro-400 shrink-0" aria-hidden="true" />
                        <span>Sede: {reserva.RecursoActividad.Sucursal.nombre}</span>
                      </div>
                    )}

                    {reserva.Instructor ? (
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-neutro-400 shrink-0" aria-hidden="true" />
                        <span>
                          Instructor: {reserva.Instructor.nombre}
                          {reserva.Instructor.especialidad ? ` (${reserva.Instructor.especialidad})` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-neutro-500 text-xs">
                        <User className="size-4 text-neutro-400 shrink-0" aria-hidden="true" />
                        <span>{textosActividades.sinInstructor}</span>
                      </div>
                    )}

                    {reserva.con_equipo && (
                      <div className="text-xs text-bronce-700 font-medium">
                        ✓ {textosActividades.conEquipo}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-neutro-100 flex justify-between items-baseline">
                    <span className="text-xs text-neutro-500">{textosActividades.totalCalculado}:</span>
                    <span className="text-base font-semibold text-bronce-800">
                      {formatearGTQ(reserva.total)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-neutro-100 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    to={ACTIVIDADES_ROUTES.DETALLE_RESERVA(reserva.id!)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-bronce-700 hover:text-bronce-800"
                  >
                    <Eye className="size-3.5" aria-hidden="true" />
                    <span>Ver detalle</span>
                  </Link>

                  {/* Botón para añadir a carrito activo y pagar si está confirmada */}
                  {estadoClave === 'confirmada' && (
                    <BotonAnadirAlCarrito
                      reservaId={reserva.id!}
                      reservaEstado={reserva.estado || 'confirmada'}
                      tipo_item="actividad"
                      size="sm"
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};
