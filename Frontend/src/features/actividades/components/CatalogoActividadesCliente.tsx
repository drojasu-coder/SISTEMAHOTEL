import React, { useMemo, useState } from 'react';
import { Search, MapPin, Compass, RefreshCw, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useRecursosActividadQuery } from '../hooks/useActividades';
import { ReservaActividadModal } from './ReservaActividadModal';
import { textosActividades, formatearGTQ } from '../textos';
import type { RecursoActividad } from '../types';

export const CatalogoActividadesCliente: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sucursalId, setSucursalId] = useState<number | 'all'>('all');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | 'all'>('all');
  const [recursoSeleccionado, setRecursoSeleccionado] = useState<RecursoActividad | null>(null);

  const recursosQuery = useRecursosActividadQuery();
  const sedesQuery = useSedesQuery();

  const sedes = sedesQuery.data ?? [];
  const sedesMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const sede of sedes) {
      map.set(sede.id, sede.nombre);
    }
    return map;
  }, [sedes]);

  const recursos = recursosQuery.data ?? [];

  // Tipos únicos para el filtro
  const tiposDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const r of recursos) {
      if (r.tipo) set.add(r.tipo);
    }
    return Array.from(set).sort();
  }, [recursos]);

  const filtrados = useMemo(() => {
    return recursos.filter((item) => {
      const matchSearch =
        item.nombre?.toLowerCase().includes(search.trim().toLowerCase()) ||
        item.tipo?.toLowerCase().includes(search.trim().toLowerCase());
      const matchSede = sucursalId === 'all' || item.sucursal_id === sucursalId;
      const matchTipo = tipoSeleccionado === 'all' || item.tipo === tipoSeleccionado;
      return matchSearch && matchSede && matchTipo;
    });
  }, [recursos, search, sucursalId, tipoSeleccionado]);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-2">
        <p className="eyebrow">{textosActividades.subtitulo}</p>
        <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
          {textosActividades.catalogoTitulo}
        </h1>
        <p className="max-w-3xl text-sm text-neutro-600">
          {textosActividades.catalogoDescripcion}
        </p>
      </div>

      {/* Barra de filtros */}
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <label htmlFor="buscar-actividad" className="sr-only">
            {textosActividades.buscarActividad}
          </label>
          <input
            id="buscar-actividad"
            type="search"
            placeholder={textosActividades.buscarActividad}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-neutro-300 py-2 pl-9 pr-3 text-sm text-neutro-900 placeholder-neutro-400 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          />
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-neutro-400" aria-hidden="true" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="filtro-sede-actividad" className="sr-only">
            {textosActividades.filtrarPorSede}
          </label>
          <select
            id="filtro-sede-actividad"
            value={sucursalId}
            onChange={(e) => {
              const val = e.target.value;
              setSucursalId(val === 'all' ? 'all' : Number(val));
            }}
            className="rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-sm text-neutro-700 bg-white focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          >
            <option value="all">{textosActividades.todasLasSedes}</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>

          {tiposDisponibles.length > 0 && (
            <>
              <label htmlFor="filtro-tipo-actividad" className="sr-only">
                {textosActividades.filtrarPorTipo}
              </label>
              <select
                id="filtro-tipo-actividad"
                value={tipoSeleccionado}
                onChange={(e) => setTipoSeleccionado(e.target.value)}
                className="rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-sm text-neutro-700 bg-white focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
              >
                <option value="all">{textosActividades.todosLosTipos}</option>
                {tiposDisponibles.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </option>
                ))}
              </select>
            </>
          )}

          {(search || sucursalId !== 'all' || tipoSeleccionado !== 'all') && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setSucursalId('all');
                setTipoSeleccionado('all');
              }}
            >
              {textosActividades.limpiarFiltros}
            </Button>
          )}
        </div>
      </Card>

      {/* Estado: Cargando */}
      {recursosQuery.isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="h-6 w-3/4 animate-pulse rounded bg-neutro-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutro-200" />
              <div className="h-10 w-full animate-pulse rounded bg-neutro-200" />
            </Card>
          ))}
        </div>
      )}

      {/* Estado: Error */}
      {recursosQuery.isError && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <Alert tone="error" title="No fue posible cargar las actividades recreativas">
            <p className="mt-1">
              Ocurrió un inconveniente al consultar las instalaciones y actividades deportivas.
            </p>
          </Alert>
          <Button
            type="button"
            variant="primary"
            onClick={() => recursosQuery.refetch()}
            className="mt-4"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            <span>{textosActividades.reintentar}</span>
          </Button>
        </Card>
      )}

      {/* Estado: Sin actividades disponibles en general */}
      {!recursosQuery.isPending && !recursosQuery.isError && recursos.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Compass className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            No hay actividades disponibles
          </h2>
          <p className="text-sm text-neutro-600 max-w-md">
            En este momento no se encuentran registradas instalaciones ni actividades recreativas en el sistema.
          </p>
        </Card>
      )}

      {/* Estado: Sin resultados con los filtros */}
      {!recursosQuery.isPending && !recursosQuery.isError && recursos.length > 0 && filtrados.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Search className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {textosActividades.sinResultados}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-4">
            Pruebe ajustando los filtros de sede, tipo o el término de búsqueda.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSearch('');
              setSucursalId('all');
              setTipoSeleccionado('all');
            }}
          >
            {textosActividades.limpiarFiltros}
          </Button>
        </Card>
      )}

      {/* Grilla de actividades */}
      {!recursosQuery.isPending && !recursosQuery.isError && filtrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((rec) => {
            const sedeNombre =
              rec.Sucursal?.nombre ||
              (rec.sucursal_id ? sedesMap.get(rec.sucursal_id) : null) ||
              textosActividades.noDisponible;

            return (
              <Card
                key={rec.id}
                className="flex flex-col justify-between p-6 hover:shadow-md transition-shadow border-neutro-200"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-bronce-700 bg-bronce-50 px-2.5 py-0.5 rounded-full mb-2">
                        <Trophy className="size-3" aria-hidden="true" />
                        {rec.tipo}
                      </span>
                      <h3 className="text-lg font-serif font-semibold text-neutro-900">
                        {rec.nombre}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-neutro-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-neutro-400 shrink-0" aria-hidden="true" />
                      <span>{sedeNombre}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutro-100 space-y-1 text-xs text-neutro-600">
                    <div className="flex justify-between items-baseline">
                      <span className="text-neutro-500">{textosActividades.precioPorHora}</span>
                      <span className="text-base font-semibold text-bronce-800">
                        {formatearGTQ(rec.precio_hora)}
                      </span>
                    </div>
                    {Number(rec.precio_instructor_hora || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutro-500">Instructor:</span>
                        <span className="font-medium text-neutro-800">
                          +{formatearGTQ(rec.precio_instructor_hora)} / hora
                        </span>
                      </div>
                    )}
                    {Number(rec.precio_equipo || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutro-500">Equipamiento:</span>
                        <span className="font-medium text-neutro-800">
                          +{formatearGTQ(rec.precio_equipo)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-neutro-100">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full justify-center"
                    onClick={() => setRecursoSeleccionado(rec)}
                  >
                    {textosActividades.reservarActividad}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de configuración y reserva */}
      <ReservaActividadModal
        recurso={recursoSeleccionado}
        isOpen={Boolean(recursoSeleccionado)}
        onClose={() => setRecursoSeleccionado(null)}
      />
    </section>
  );
};
