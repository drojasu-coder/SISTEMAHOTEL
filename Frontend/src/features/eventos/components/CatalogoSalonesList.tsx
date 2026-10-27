import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Search, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useSalonesQuery } from '../hooks/useEventos';
import { ReservaEventoModal } from './ReservaEventoModal';
import { textosEventos, formatearGTQ } from '../textos';
import type { Salon } from '../types';
import { getApiErrorMessage } from '@/api/errors';

export const CatalogoSalonesList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState<string>('todas');
  const [salonSeleccionadoParaReserva, setSalonSeleccionadoParaReserva] = useState<Salon | null>(null);

  const salonesQuery = useSalonesQuery();
  const salones = salonesQuery.data ?? [];

  // Extraer sucursales únicas presentes en los salones
  const sucursales = useMemo(() => {
    const map = new Map<number, string>();
    salones.forEach((s) => {
      if (s.sucursal_id && s.sucursal?.nombre) {
        map.set(s.sucursal_id, s.sucursal.nombre);
      }
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [salones]);

  const salonesFiltrados = useMemo(() => {
    return salones.filter((s) => {
      const matchSearch =
        !searchTerm.trim() ||
        (s.nombre ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.descripcion ?? '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchSucursal =
        selectedSucursal === 'todas' || s.sucursal_id === Number(selectedSucursal);

      return matchSearch && matchSucursal;
    });
  }, [salones, searchTerm, selectedSucursal]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-2">
        <p className="eyebrow">{textosEventos.catalogoEyebrow}</p>
        <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
          {textosEventos.catalogoTitulo}
        </h1>
        <p className="max-w-3xl text-sm text-neutro-600 sm:text-base">
          {textosEventos.catalogoDescripcion}
        </p>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-neutro-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-400" aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={textosEventos.buscarSalon}
            className="w-full rounded-lg border border-neutro-300 pl-9 pr-3 py-2 text-sm text-neutro-900 placeholder-neutro-400 focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
          />
        </div>

        {sucursales.length > 0 && (
          <div className="w-full sm:w-64">
            <label htmlFor="filtro-sucursal" className="sr-only">
              {textosEventos.filtroSucursal}
            </label>
            <select
              id="filtro-sucursal"
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
            >
              <option value="todas">{textosEventos.todasLasSedes}</option>
              {sucursales.map((suc) => (
                <option key={suc.id} value={suc.id}>
                  {suc.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Estados de carga y error */}
      {salonesQuery.isPending && (
        <div className="flex justify-center py-16">
          <LoadingNotice label="Cargando salones disponibles..." />
        </div>
      )}

      {salonesQuery.isError && (
        <Card className="p-6">
          <Alert tone="error" title="No fue posible cargar los salones">
            {getApiErrorMessage(salonesQuery.error)}
          </Alert>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => void salonesQuery.refetch()}>
              Reintentar
            </Button>
          </div>
        </Card>
      )}

      {/* Listado de salones */}
      {!salonesQuery.isPending && !salonesQuery.isError && (
        <>
          {salonesFiltrados.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <Building2 className="size-12 text-neutro-300 mb-3" aria-hidden="true" />
              <h2 className="text-lg font-serif font-semibold text-neutro-800">
                {textosEventos.sinSalonesTitulo}
              </h2>
              <p className="mt-1 text-sm text-neutro-500 max-w-md">
                {textosEventos.sinSalonesMensaje}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {salonesFiltrados.map((salon) => (
                <Card
                  key={salon.id}
                  className="flex flex-col justify-between overflow-hidden border border-neutro-200 transition-all hover:border-selva-300 hover:shadow-soft"
                >
                  <div className="flex flex-col p-6">
                    {/* Badge Sede */}
                    {salon.sucursal?.nombre && (
                      <span className="mb-2 self-start rounded-full bg-selva-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-selva-700">
                        {salon.sucursal.nombre}
                      </span>
                    )}

                    <h2 className="text-xl font-serif font-bold text-neutro-900 mb-2">
                      {salon.nombre}
                    </h2>

                    <p className="text-xs text-neutro-600 line-clamp-3 mb-4 flex-1">
                      {salon.descripcion || 'Elegante salón equipado para celebraciones y eventos de alto nivel.'}
                    </p>

                    <div className="flex flex-col gap-2 border-t border-neutro-100 pt-4 text-xs text-neutro-600">
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-neutro-400" aria-hidden="true" />
                        <span>{textosEventos.capacidadPersonas(salon.capacidad_maxima ?? 0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-bronce-500" aria-hidden="true" />
                        <span>
                          {textosEventos.tarifaBaseDesde}:{' '}
                          <strong className="text-neutro-900 font-semibold">
                            {formatearGTQ(salon.tarifa_base)}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-neutro-100 bg-neutro-50/50 p-4">
                    <Link
                      to={`/eventos/salones/${salon.id}`}
                      className={buttonStyles({
                        variant: 'secondary',
                        className: 'flex-1 text-xs justify-center',
                      })}
                    >
                      {textosEventos.verDetalleSalon}
                    </Link>
                    <Button
                      variant="primary"
                      className="flex-1 text-xs justify-center"
                      onClick={() => setSalonSeleccionadoParaReserva(salon)}
                    >
                      {textosEventos.solicitarCotizacion}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Reserva / Cotización */}
      {salonSeleccionadoParaReserva && (
        <ReservaEventoModal
          salon={salonSeleccionadoParaReserva}
          isOpen={Boolean(salonSeleccionadoParaReserva)}
          onClose={() => setSalonSeleccionadoParaReserva(null)}
        />
      )}
    </section>
  );
};
