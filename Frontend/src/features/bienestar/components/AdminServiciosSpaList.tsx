import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Plus, Clock, Edit, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useServiciosSpaQuery } from '../hooks/useBienestar';
import { ServicioSpaFormModal } from './ServicioSpaFormModal';
import { textosBienestar, formatearGTQ } from '../textos';
import type { ServicioBienestar } from '../types';

export const AdminServiciosSpaList: React.FC = () => {
  const serviciosQuery = useServiciosSpaQuery();
  const [servicioEnEdicion, setServicioEnEdicion] = useState<ServicioBienestar | null | undefined>(
    undefined
  );

  const servicios = serviciosQuery.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-12">
      {/* Retorno */}
      <Link
        to="/admin/servicios"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-bronce-700 transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>Volver a servicios</span>
      </Link>

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosBienestar.adminCitasSubtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
            {textosBienestar.adminServiciosTitulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {textosBienestar.adminServiciosDesc}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => setServicioEnEdicion(null)}
          className="inline-flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>{textosBienestar.nuevoServicio}</span>
        </Button>
      </div>

      {/* Estado: Cargando */}
      {serviciosQuery.isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="h-5 w-1/3 animate-pulse rounded bg-neutro-200 mb-2" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-neutro-200" />
            </Card>
          ))}
        </div>
      )}

      {/* Estado: Error */}
      {serviciosQuery.isError && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            Error al consultar los servicios
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            Ocurrió un error al cargar la lista de servicios de bienestar.
          </p>
          <Button type="button" variant="primary" onClick={() => serviciosQuery.refetch()}>
            {textosBienestar.reintentar}
          </Button>
        </Card>
      )}

      {/* Estado: Vacío */}
      {!serviciosQuery.isPending && !serviciosQuery.isError && servicios.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Sparkles className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {textosBienestar.sinServiciosTitulo}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            {textosBienestar.sinServiciosDesc}
          </p>
          <Button type="button" variant="primary" onClick={() => setServicioEnEdicion(null)}>
            <Plus className="size-4 mr-2" aria-hidden="true" />
            <span>{textosBienestar.nuevoServicio}</span>
          </Button>
        </Card>
      )}

      {/* Lista de Servicios */}
      {!serviciosQuery.isPending && !serviciosQuery.isError && servicios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servicios.map((s) => (
            <Card
              key={s.id}
              className="flex overflow-hidden p-0 transition-all hover:border-neutro-300"
            >
              <div className="relative size-24 shrink-0 bg-sand-100 overflow-hidden sm:size-28">
                {s.imagen_url ? (
                  <img
                    src={s.imagen_url}
                    alt={s.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-bronce-500">
                    <Sparkles className="size-6 text-bronce-400" aria-hidden="true" />
                  </div>
                )}
                {s.imagen_creditos?.autor && (
                  <span className="absolute bottom-1 right-1 z-10 rounded bg-black/60 px-1 py-0.5 text-[9px] text-white backdrop-blur-sm">
                    {s.imagen_creditos.autor}
                  </span>
                )}
              </div>
              <div className="flex flex-1 items-center justify-between p-4 sm:p-5">
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-neutro-900 text-base">
                    {s.nombre}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-neutro-600">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5 text-neutro-400" />
                      {s.duracion_minutos} {textosBienestar.minutos}
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-bronce-700">
                      {formatearGTQ(s.precio)}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setServicioEnEdicion(s)}
                  className="inline-flex items-center gap-1.5 text-xs shrink-0"
                >
                  <Edit className="size-3.5" aria-hidden="true" />
                  <span>{textosBienestar.editarServicio}</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {servicioEnEdicion !== undefined && (
        <ServicioSpaFormModal
          servicio={servicioEnEdicion}
          onClose={() => setServicioEnEdicion(undefined)}
          onSuccess={() => serviciosQuery.refetch()}
        />
      )}
    </div>
  );
};
