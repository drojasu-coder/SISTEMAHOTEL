import React, { useState } from 'react';
import { EventosAdminNav } from './EventosAdminNav';
import { useTextosGestionEventos } from '../gestionTextos';
import { Plus, Sparkles, Edit, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useServiciosEventoQuery, useDeleteServicioEventoMutation } from '../hooks/useEventos';
import { ServicioEventoFormModal } from './ServicioEventoFormModal';
import { textosEventos, formatearGTQ } from '../textos';
import type { ServicioEvento } from '../types';
import { getApiErrorMessage } from '@/api/errors';

export const AdminServiciosEventoList: React.FC = () => {
  const tg = useTextosGestionEventos();
  const serviciosQuery = useServiciosEventoQuery();
  const deleteMutation = useDeleteServicioEventoMutation();

  const [servicioEnEdicion, setServicioEnEdicion] = useState<ServicioEvento | null | undefined>(
    undefined
  );
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const servicios = serviciosQuery.data ?? [];

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este servicio del catálogo?')) return;
    setErrorAccion(null);
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: unknown) {
      setErrorAccion(getApiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutro-500">{tg.modulo}</p>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{tg.nav.servicios}</h1>
        </div>
        <Button type="button" onClick={() => setServicioEnEdicion(null)}><Plus className="size-4" aria-hidden="true" /><span>{textosEventos.nuevoServicioBoton}</span></Button>
      </header>
      <EventosAdminNav />

      {errorAccion && (
        <Alert tone="error" title="No fue posible completar la acción">
          {errorAccion}
        </Alert>
      )}

      {/* Estados */}
      {serviciosQuery.isPending && (
        <div className="flex justify-center py-16">
          <LoadingNotice label="Cargando servicios de eventos..." />
        </div>
      )}

      {serviciosQuery.isError && (
        <Card className="p-6">
          <Alert tone="error" title="Error al listar servicios">
            {getApiErrorMessage(serviciosQuery.error)}
          </Alert>
        </Card>
      )}

      {!serviciosQuery.isPending && !serviciosQuery.isError && (
        <>
          {servicios.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <Sparkles className="size-12 text-neutro-300 mb-3" aria-hidden="true" />
              <h2 className="text-base font-semibold text-neutro-800">
                No hay servicios de evento registrados
              </h2>
              <p className="mt-1 text-sm text-neutro-500">
                Haga clic en &quot;Nuevo servicio&quot; para registrar opciones de banquete o equipamiento.
              </p>
            </Card>
          ) : (
            <div className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white">
              {servicios.map((servicio) => (
                <div
                  key={servicio.id}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-neutro-50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-neutro-900 text-sm sm:text-base">
                      {servicio.nombre}
                    </span>
                    <span className="text-xs text-neutro-500">
                      ID: #{servicio.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    <span className="text-sm sm:text-base font-bold text-neutro-900">
                      {formatearGTQ(servicio.precio)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setServicioEnEdicion(servicio)}
                        className="text-xs"
                      >
                        <Edit className="size-3.5" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">{textosEventos.editarServicio}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(servicio.id)}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-rojo-600 hover:text-rojo-700 hover:bg-rojo-50"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {servicioEnEdicion !== undefined && (
        <ServicioEventoFormModal
          servicio={servicioEnEdicion}
          isOpen={servicioEnEdicion !== undefined}
          onClose={() => setServicioEnEdicion(undefined)}
        />
      )}
    </div>
  );
};
