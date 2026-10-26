import React, { useMemo, useState } from 'react';
import { Search, MapPin, Users, Sparkles, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useAmenidadesQuery } from '../hooks/useAmenidades';
import { ReservaAmenidadFormModal } from './ReservaAmenidadFormModal';
import { textosAmenidades } from '../textos';
import type { Amenidad } from '../types';

export const CatalogoAmenidadesCliente: React.FC = () => {
  const t = textosAmenidades;
  const tc = textosAmenidades.cliente;

  const [search, setSearch] = useState('');
  const [sucursalId, setSucursalId] = useState<number | 'all'>('all');
  const [amenidadSeleccionada, setAmenidadSeleccionada] = useState<Amenidad | null>(null);

  const amenidadesQuery = useAmenidadesQuery();
  const sedesQuery = useSedesQuery();

  const sedes = sedesQuery.data ?? [];
  const sedesMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const sede of sedes) {
      map.set(sede.id, sede.nombre);
    }
    return map;
  }, [sedes]);

  const amenidades = amenidadesQuery.data ?? [];

  const filtradas = useMemo(() => {
    return amenidades.filter((item) => {
      const matchSearch = item.nombre.toLowerCase().includes(search.trim().toLowerCase());
      const matchSede = sucursalId === 'all' || item.sucursal_id === sucursalId;
      return matchSearch && matchSede;
    });
  }, [amenidades, search, sucursalId]);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-2">
        <p className="eyebrow">{tc.catalogoSubtitulo}</p>
        <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
          {tc.catalogoTitulo}
        </h1>
        <p className="max-w-3xl text-sm text-neutro-600">
          {tc.catalogoDescripcion}
        </p>
      </div>

      {/* Barra de filtros */}
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <label htmlFor="buscar-amenidad" className="sr-only">
            {t.buscarLabel}
          </label>
          <input
            id="buscar-amenidad"
            type="search"
            placeholder={t.buscarPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-neutro-300 py-2 pl-9 pr-3 text-sm text-neutro-900 placeholder-neutro-400 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          />
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-neutro-400" aria-hidden="true" />
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="filtro-sede-cliente" className="sr-only">
            {t.filtroSedeLabel}
          </label>
          <select
            id="filtro-sede-cliente"
            value={sucursalId}
            onChange={(e) => {
              const val = e.target.value;
              setSucursalId(val === 'all' ? 'all' : Number(val));
            }}
            className="rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          >
            <option value="all">{t.todasLasSedes}</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>

          {(search || sucursalId !== 'all') && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setSucursalId('all');
              }}
            >
              {t.limpiarFiltros}
            </Button>
          )}
        </div>
      </Card>

      {/* Estados de carga / error */}
      {amenidadesQuery.isLoading && (
        <div className="flex justify-center py-16">
          <LoadingNotice label={t.cargando} />
        </div>
      )}

      {amenidadesQuery.isError && (
        <Card className="flex flex-col items-start gap-4 p-6">
          <Alert tone="error" title={t.errorCargar}>
            <p>Ocurrió un problema al obtener el catálogo de amenidades.</p>
          </Alert>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => amenidadesQuery.refetch()}
          >
            <RefreshCw className="mr-2 size-4" aria-hidden="true" />
            {tc.reintentar}
          </Button>
        </Card>
      )}

      {/* Lista vacía */}
      {!amenidadesQuery.isLoading && !amenidadesQuery.isError && filtradas.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <Sparkles className="size-12 text-neutro-400" aria-hidden="true" />
          <div className="flex max-w-md flex-col gap-1">
            <h2 className="text-lg font-serif font-semibold text-neutro-800">
              {search || sucursalId !== 'all' ? t.sinResultados : t.sinAmenidadesTitulo}
            </h2>
            <p className="text-xs text-neutro-600">
              {search || sucursalId !== 'all' ? t.sinAmenidadesDescLectura : t.sinAmenidadesDescLectura}
            </p>
          </div>
          {(search || sucursalId !== 'all') && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setSucursalId('all');
              }}
            >
              {t.limpiarFiltros}
            </Button>
          )}
        </Card>
      )}

      {/* Catálogo de amenidades */}
      {!amenidadesQuery.isLoading && !amenidadesQuery.isError && filtradas.length > 0 && (
        <>
          <p className="text-xs text-neutro-500">
            {t.amenidadesMostradas(filtradas.length)}
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtradas.map((item) => {
              const sedeNombre = item.Sucursal?.nombre || sedesMap.get(item.sucursal_id) || t.sedeNoEspecificada;

              return (
                <Card
                  key={item.id}
                  className="flex flex-col justify-between overflow-hidden p-0 transition-shadow hover:shadow-md border border-neutro-200"
                >
                  <div>
                    {item.imagen_url ? (
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutro-100">
                        <img
                          src={item.imagen_url}
                          alt={item.nombre}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                        {item.imagen_creditos?.autor && (
                          <span className="absolute bottom-1 right-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                            {item.imagen_creditos.url ? (
                              <a
                                href={item.imagen_creditos.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-neutro-200 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Foto: {item.imagen_creditos.autor} ({item.imagen_creditos.licencia || "CC"})
                              </a>
                            ) : (
                              `Foto: ${item.imagen_creditos.autor} (${item.imagen_creditos.licencia || "CC"})`
                            )}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex aspect-[16/9] w-full items-center justify-center bg-sand-100 text-neutro-400">
                        <Sparkles className="size-8 text-bronce-400" aria-hidden="true" />
                      </div>
                    )}

                    <div className="p-6">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-bronce-700 mb-2">
                      <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                      <span>{sedeNombre}</span>
                    </div>

                    <h2 className="text-xl font-serif font-bold text-neutro-900 mb-2">
                      {item.nombre}
                    </h2>

                    <div className="flex items-center gap-2 text-xs text-neutro-600 mt-4 rounded-md bg-neutro-50 p-2.5 border border-neutro-200">
                      <Users className="size-4 shrink-0 text-neutro-500" aria-hidden="true" />
                      <span>
                        Aforo máximo: <strong>{t.aforoPersonas(item.aforo_maximo)}</strong>
                      </span>
                    </div>
                    </div>
                  </div>

                  <div className="border-t border-neutro-200 bg-neutro-50/50 p-4">
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full"
                      onClick={() => setAmenidadSeleccionada(item)}
                    >
                      {tc.reservarAcceso}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Modal de Reserva */}
      <ReservaAmenidadFormModal
        amenidad={amenidadSeleccionada}
        isOpen={Boolean(amenidadSeleccionada)}
        onClose={() => setAmenidadSeleccionada(null)}
      />
    </section>
  );
};
