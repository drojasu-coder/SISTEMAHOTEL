import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useServiciosSpaQuery } from '../hooks/useBienestar';
import { ReservaCitaModal } from './ReservaCitaModal';
import { textosBienestar, formatearGTQ } from '../textos';
import type { ServicioBienestar } from '../types';

export const CatalogoBienestarList: React.FC = () => {
  const serviciosQuery = useServiciosSpaQuery();
  const [busqueda, setBusqueda] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState<ServicioBienestar | null>(null);

  const servicios = serviciosQuery.data ?? [];

  const serviciosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return servicios;
    const q = busqueda.toLowerCase().trim();
    return servicios.filter((s) => s.nombre?.toLowerCase().includes(q));
  }, [servicios, busqueda]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-1.5">
        <p className="eyebrow">{textosBienestar.subtitulo}</p>
        <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
          {textosBienestar.catalogoTitulo}
        </h1>
        <p className="max-w-2xl text-sm text-neutro-600">
          {textosBienestar.catalogoDescripcion}
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative max-w-md">
        <label htmlFor="busqueda-bienestar" className="sr-only">
          {textosBienestar.buscar}
        </label>
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-400" aria-hidden="true" />
        <input
          id="busqueda-bienestar"
          type="search"
          placeholder={textosBienestar.buscar}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full rounded-md border border-neutro-300 bg-white py-2 pl-9 pr-4 text-sm text-neutro-900 shadow-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
        />
      </div>

      {/* Estado: Cargando */}
      {serviciosQuery.isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="h-6 w-3/4 animate-pulse rounded bg-neutro-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutro-200" />
              <div className="h-10 w-full animate-pulse rounded bg-neutro-200" />
            </Card>
          ))}
        </div>
      )}

      {/* Estado: Error */}
      {serviciosQuery.isError && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            Error al consultar los servicios de bienestar
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            Ocurrió un inconveniente al cargar el catálogo de tratamientos. Por favor intente de nuevo.
          </p>
          <Button type="button" variant="primary" onClick={() => serviciosQuery.refetch()}>
            {textosBienestar.reintentar}
          </Button>
        </Card>
      )}

      {/* Estado: Vacío */}
      {!serviciosQuery.isPending && !serviciosQuery.isError && serviciosFiltrados.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Sparkles className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {textosBienestar.sinServiciosTitulo}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md">
            {busqueda ? 'No se encontraron servicios que coincidan con la búsqueda.' : textosBienestar.sinServiciosDesc}
          </p>
          {busqueda && (
            <Button type="button" variant="secondary" onClick={() => setBusqueda('')} className="mt-4">
              {textosBienestar.limpiarFiltros}
            </Button>
          )}
        </Card>
      )}

      {/* Lista de Servicios */}
      {!serviciosQuery.isPending && !serviciosQuery.isError && serviciosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviciosFiltrados.map((servicio) => (
            <Card
              key={servicio.id}
              className="flex flex-col justify-between p-6 transition-all hover:border-selva-300 hover:shadow-soft"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-selva-100 text-selva-800">
                    <Sparkles className="size-5" aria-hidden="true" />
                  </div>
                  <span className="text-lg font-bold text-selva-800 font-serif">
                    {formatearGTQ(servicio.precio)}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-bold text-neutro-900">
                    {servicio.nombre}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-xs text-neutro-600">
                    <Clock className="size-3.5 text-neutro-400" />
                    <span>
                      {servicio.duracion_minutos} {textosBienestar.minutos} de sesión
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full justify-center"
                  onClick={() => setServicioSeleccionado(servicio)}
                >
                  <Calendar className="size-4" aria-hidden="true" />
                  <span>{textosBienestar.reservarCita}</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Reserva */}
      {servicioSeleccionado && (
        <ReservaCitaModal
          servicio={servicioSeleccionado}
          onClose={() => setServicioSeleccionado(null)}
        />
      )}
    </section>
  );
};
