import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Plus,
  Calendar,
  Clock,
  User,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { useMisCitasSpaQuery } from '../hooks/useBienestar';
import { BIENESTAR_ROUTES } from '../constants/routes';
import { textosBienestar, formatearGTQ } from '../textos';
import { MisReservasLayout } from '@/features/mis-reservas/components/MisReservasLayout';
import { BotonAnadirAlCarrito } from '@/features/carrito/components/BotonAnadirAlCarrito';
import { cn } from '@/lib/cn';

const estadoClases = (estado: string) => {
  if (estado === 'confirmada') return 'border-exito-600/20 bg-exito-50 text-exito-700';
  if (estado === 'cancelada') return 'border-error-600/20 bg-error-50 text-error-700';
  return 'border-neutro-200 bg-neutro-100 text-neutro-600';
};

export const MisCitasSpaList: React.FC = () => {
  const { user } = useAuth();
  const citasQuery = useMisCitasSpaQuery(user?.id);
  const citas = citasQuery.data ?? [];

  return (
    <MisReservasLayout>
      <div className="flex flex-col gap-6">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-serif font-semibold text-neutro-900 sm:text-2xl">
              {textosBienestar.pestanaBienestar}
            </h1>
            {!citasQuery.isPending && !citasQuery.isError && citas.length > 0 && (
              <p className="text-xs text-neutro-500">
                {citas.length === 1 ? "1 cita" : `${citas.length} citas`}
              </p>
            )}
          </div>
          <Link
            to={BIENESTAR_ROUTES.CATALOGO}
            className="inline-flex items-center gap-2 self-start rounded-md bg-bronce-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-bronce-700 transition-colors sm:self-center"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>{textosBienestar.reservarCita}</span>
          </Link>
        </div>

        {/* Cargando */}
        {citasQuery.isPending && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-busy="true">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="surface space-y-3 p-4"
              >
                <div className="h-4 w-1/3 animate-pulse rounded bg-neutro-200" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-neutro-200" />
                <div className="h-8 w-full animate-pulse rounded bg-neutro-200" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {citasQuery.isError && (
          <Card className="flex flex-col items-center justify-center p-10 text-center">
            <AlertCircle className="size-10 text-error-500 mb-3" aria-hidden="true" />
            <h2 className="text-base font-semibold text-neutro-900 mb-2">
              {textosBienestar.errorCargarReservas}
            </h2>
            <Button type="button" variant="primary" size="sm" onClick={() => citasQuery.refetch()}>
              {textosBienestar.reintentar}
            </Button>
          </Card>
        )}

        {/* Estado vacío */}
        {!citasQuery.isPending && !citasQuery.isError && citas.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <Heart className="size-10 text-neutro-300" aria-hidden="true" />
            <div className="flex max-w-sm flex-col gap-1">
              <h2 className="text-base font-serif font-semibold text-neutro-800">
                {textosBienestar.sinCitasTitulo}
              </h2>
              <p className="text-xs text-neutro-500">{textosBienestar.sinCitasDesc}</p>
            </div>
            <Link
              to={BIENESTAR_ROUTES.CATALOGO}
              className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-bronce-700 transition-colors"
            >
              <span>{textosBienestar.explorarCatalogo}</span>
            </Link>
          </Card>
        )}

        {/* Listado */}
        {!citasQuery.isPending && !citasQuery.isError && citas.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {citas.map((cita) => (
              <article
                key={cita.id}
                className="surface flex flex-col gap-3 p-4 transition-shadow hover:shadow-md"
              >
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-bronce-700">
                      {textosBienestar.citaNumero(cita.id ?? '')}
                    </p>
                    <h2 className="truncate text-sm font-semibold text-neutro-900">
                      {cita.ServicioBienestar?.nombre ?? 'Servicio de bienestar'}
                    </h2>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                      estadoClases(cita.estado ?? ''),
                    )}
                  >
                    {cita.estado}
                  </span>
                </div>

                {/* Detalles compactos */}
                <dl className="flex flex-col gap-1.5 text-xs text-neutro-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 shrink-0 text-neutro-400" aria-hidden="true" />
                    <dt className="sr-only">Fecha</dt>
                    <dd>{cita.fecha}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 shrink-0 text-neutro-400" aria-hidden="true" />
                    <dt className="sr-only">Hora</dt>
                    <dd>
                      {cita.hora_inicio} – {cita.hora_fin}
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="size-3.5 shrink-0 text-neutro-400" aria-hidden="true" />
                    <dt className="sr-only">Terapeuta</dt>
                    <dd className="truncate">{cita.Terapeuta?.nombre ?? 'Terapeuta asignado'}</dd>
                  </div>
                </dl>

                {/* Pie: importe + acciones */}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-neutro-100 pt-3">
                  {cita.ServicioBienestar?.precio !== undefined ? (
                    <span className="text-sm font-semibold text-neutro-900">
                      {formatearGTQ(cita.ServicioBienestar.precio)}
                    </span>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-2">
                    {cita.id && (
                      <BotonAnadirAlCarrito
                        reservaId={cita.id}
                        reservaEstado={cita.estado ?? 'confirmada'}
                        tipo_item="bienestar"
                        size="sm"
                      />
                    )}
                    <Link
                      to={BIENESTAR_ROUTES.DETALLE(cita.id ?? '')}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-bronce-700 hover:text-bronce-900 transition-colors"
                    >
                      <span>Ver</span>
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </MisReservasLayout>
  );
};
