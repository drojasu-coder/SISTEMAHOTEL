import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Sparkles,
  Search,
  Eye,
  Edit,
  AlertCircle,
  CalendarCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAdminCitasSpaQuery, useTerapeutasQuery } from '../hooks/useBienestar';
import { AdminCitaEstadoModal } from './AdminCitaEstadoModal';
import { BIENESTAR_ROUTES } from '../constants/routes';
import { textosBienestar, formatearGTQ } from '../textos';
import type { CitaBienestar } from '../types';

export const AdminCitasSpaList: React.FC = () => {
  const citasQuery = useAdminCitasSpaQuery();
  const terapeutasQuery = useTerapeutasQuery();

  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroTerapeuta, setFiltroTerapeuta] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [citaParaCambio, setCitaParaCambio] = useState<CitaBienestar | null>(null);

  const citas = citasQuery.data ?? [];
  const terapeutas = terapeutasQuery.data ?? [];

  const citasFiltradas = useMemo(() => {
    return citas.filter((cita) => {
      if (filtroEstado !== 'todos' && cita.estado !== filtroEstado) {
        return false;
      }
      if (filtroTerapeuta !== 'todos' && String(cita.terapeuta_id) !== filtroTerapeuta) {
        return false;
      }
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const clienteNombre = cita.Usuario?.nombre?.toLowerCase() ?? '';
        const clienteEmail = cita.Usuario?.email?.toLowerCase() ?? '';
        const servicioNombre = cita.ServicioBienestar?.nombre?.toLowerCase() ?? '';
        const terapeutaNombre = cita.Terapeuta?.nombre?.toLowerCase() ?? '';
        if (
          !clienteNombre.includes(q) &&
          !clienteEmail.includes(q) &&
          !servicioNombre.includes(q) &&
          !terapeutaNombre.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [citas, filtroEstado, filtroTerapeuta, busqueda]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-1.5">
        <p className="eyebrow">{textosBienestar.adminCitasSubtitulo}</p>
        <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
          {textosBienestar.adminCitasTitulo}
        </h1>
        <p className="max-w-2xl text-sm text-neutro-600">
          {textosBienestar.adminCitasDesc}
        </p>
      </div>

      {/* Enlaces de gestión complementaria */}
      <div className="flex flex-wrap gap-3">
        <Link
          to={BIENESTAR_ROUTES.ADMIN_SERVICIOS}
          className="inline-flex items-center gap-1.5 rounded-md border border-neutro-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutro-700 shadow-sm hover:bg-neutro-50 transition-colors"
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          <span>Gestionar servicios de spa</span>
        </Link>
        <Link
          to={BIENESTAR_ROUTES.ADMIN_TERAPEUTAS}
          className="inline-flex items-center gap-1.5 rounded-md border border-neutro-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutro-700 shadow-sm hover:bg-neutro-50 transition-colors"
        >
          <User className="size-3.5" aria-hidden="true" />
          <span>Gestionar terapeutas</span>
        </Link>
      </div>

      {/* Filtros */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="busqueda-citas" className="text-xs font-semibold text-neutro-700">
              Buscar huésped, servicio o terapeuta
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-400" aria-hidden="true" />
              <input
                id="busqueda-citas"
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, correo o servicio..."
                className="w-full rounded-md border border-neutro-300 bg-white py-2 pl-9 pr-3 text-sm text-neutro-900 shadow-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
              />
            </div>
          </div>

          {/* Filtro por Estado */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-estado" className="text-xs font-semibold text-neutro-700">
              Estado operativo
            </label>
            <select
              id="filtro-estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 shadow-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="confirmada">{textosBienestar.estados.confirmada}</option>
              <option value="completada">{textosBienestar.estados.completada}</option>
              <option value="cancelada">{textosBienestar.estados.cancelada}</option>
            </select>
          </div>

          {/* Filtro por Terapeuta */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-terapeuta" className="text-xs font-semibold text-neutro-700">
              Terapeuta
            </label>
            <select
              id="filtro-terapeuta"
              value={filtroTerapeuta}
              onChange={(e) => setFiltroTerapeuta(e.target.value)}
              className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 shadow-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
            >
              <option value="todos">Todos los terapeutas</option>
              {terapeutas.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Estado: Cargando */}
      {citasQuery.isPending && (
        <div className="space-y-4" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="h-5 w-1/4 animate-pulse rounded bg-neutro-200 mb-3" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutro-200" />
            </Card>
          ))}
        </div>
      )}

      {/* Estado: Error */}
      {citasQuery.isError && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            Error al consultar las citas de spa
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            Ocurrió un error al cargar el listado general de citas de bienestar.
          </p>
          <Button type="button" variant="primary" onClick={() => citasQuery.refetch()}>
            {textosBienestar.reintentar}
          </Button>
        </Card>
      )}

      {/* Estado: Vacío */}
      {!citasQuery.isPending && !citasQuery.isError && citasFiltradas.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <CalendarCheck className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {textosBienestar.sinCitasAdminTitulo}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md">
            {textosBienestar.sinCitasAdminDesc}
          </p>
        </Card>
      )}

      {/* Lista de Citas Administrativas */}
      {!citasQuery.isPending && !citasQuery.isError && citasFiltradas.length > 0 && (
        <div className="flex flex-col gap-4">
          {citasFiltradas.map((cita) => {
            const estadoClases =
              cita.estado === 'confirmada'
                ? 'bg-selva-100 text-selva-800'
                : cita.estado === 'cancelada'
                ? 'bg-rojo-100 text-rojo-800'
                : 'bg-neutro-100 text-neutro-800';

            return (
              <Card
                key={cita.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 transition-all hover:border-neutro-300"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-neutro-500 uppercase">
                      {textosBienestar.citaNumero(cita.id ?? '')}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${estadoClases}`}
                    >
                      {cita.estado}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-neutro-900">
                    {cita.ServicioBienestar?.nombre ?? 'Tratamiento de spa'}
                  </h3>

                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-neutro-600">
                    <div className="flex items-center gap-1.5">
                      <User className="size-3.5 text-neutro-400" />
                      <span>
                        Huésped: <strong className="text-neutro-900">{cita.Usuario?.nombre ?? 'Cliente'}</strong> ({cita.Usuario?.email ?? ''})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-neutro-400" />
                      <span>{cita.fecha}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-neutro-400" />
                      <span>{cita.hora_inicio} - {cita.hora_fin}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="size-3.5 text-neutro-400" />
                      <span>Terapeuta: <strong>{cita.Terapeuta?.nombre ?? 'Sin asignar'}</strong></span>
                    </div>

                    {cita.ServicioBienestar?.precio !== undefined && (
                      <div>
                        <span>Tarifa: <strong className="text-bronce-700">{formatearGTQ(cita.ServicioBienestar.precio)}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 self-end sm:self-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setCitaParaCambio(cita)}
                    className="inline-flex items-center gap-1 text-xs"
                  >
                    <Edit className="size-3.5" aria-hidden="true" />
                    <span>{textosBienestar.cambiarEstado}</span>
                  </Button>

                  <Link
                    to={BIENESTAR_ROUTES.ADMIN_CITA_DETALLE(cita.id ?? '')}
                    className="inline-flex items-center gap-1 rounded-md border border-neutro-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutro-700 shadow-sm hover:bg-neutro-50 transition-colors"
                  >
                    <Eye className="size-3.5" aria-hidden="true" />
                    <span>Detalle</span>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Cambio de Estado */}
      {citaParaCambio && (
        <AdminCitaEstadoModal
          cita={citaParaCambio}
          onClose={() => setCitaParaCambio(null)}
          onSuccess={() => citasQuery.refetch()}
        />
      )}
    </div>
  );
};
