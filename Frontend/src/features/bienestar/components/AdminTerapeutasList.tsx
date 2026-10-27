import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Plus, Edit, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTerapeutasQuery } from '../hooks/useBienestar';
import { TerapeutaFormModal } from './TerapeutaFormModal';
import { textosBienestar } from '../textos';
import type { Terapeuta } from '../types';

export const AdminTerapeutasList: React.FC = () => {
  const terapeutasQuery = useTerapeutasQuery();
  const [terapeutaEnEdicion, setTerapeutaEnEdicion] = useState<Terapeuta | null | undefined>(
    undefined
  );

  const terapeutas = terapeutasQuery.data ?? [];

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
            {textosBienestar.adminTerapeutasTitulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {textosBienestar.adminTerapeutasDesc}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => setTerapeutaEnEdicion(null)}
          className="inline-flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>{textosBienestar.nuevoTerapeuta}</span>
        </Button>
      </div>

      {/* Estado: Cargando */}
      {terapeutasQuery.isPending && (
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
      {terapeutasQuery.isError && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            Error al consultar los terapeutas
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            Ocurrió un error al cargar la lista de terapeutas registrados.
          </p>
          <Button type="button" variant="primary" onClick={() => terapeutasQuery.refetch()}>
            {textosBienestar.reintentar}
          </Button>
        </Card>
      )}

      {/* Estado: Vacío */}
      {!terapeutasQuery.isPending && !terapeutasQuery.isError && terapeutas.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <User className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {textosBienestar.sinTerapeutasTitulo}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            {textosBienestar.sinTerapeutasDesc}
          </p>
          <Button type="button" variant="primary" onClick={() => setTerapeutaEnEdicion(null)}>
            <Plus className="size-4 mr-2" aria-hidden="true" />
            <span>{textosBienestar.nuevoTerapeuta}</span>
          </Button>
        </Card>
      )}

      {/* Lista de Terapeutas */}
      {!terapeutasQuery.isPending && !terapeutasQuery.isError && terapeutas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {terapeutas.map((t) => (
            <Card
              key={t.id}
              className="flex items-center justify-between p-5 transition-all hover:border-neutro-300"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-neutro-900 text-base">
                    {t.nombre}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold uppercase ${
                      t.activo
                        ? 'bg-selva-100 text-selva-800'
                        : 'bg-neutro-100 text-neutro-600'
                    }`}
                  >
                    {t.activo ? textosBienestar.terapeutaActivo : textosBienestar.terapeutaInactivo}
                  </span>
                </div>
                <p className="text-xs text-neutro-500">ID del profesional: #{t.id}</p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setTerapeutaEnEdicion(t)}
                className="inline-flex items-center gap-1.5 text-xs"
              >
                <Edit className="size-3.5" aria-hidden="true" />
                <span>{textosBienestar.editarTerapeuta}</span>
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {terapeutaEnEdicion !== undefined && (
        <TerapeutaFormModal
          terapeuta={terapeutaEnEdicion}
          onClose={() => setTerapeutaEnEdicion(undefined)}
          onSuccess={() => terapeutasQuery.refetch()}
        />
      )}
    </div>
  );
};
