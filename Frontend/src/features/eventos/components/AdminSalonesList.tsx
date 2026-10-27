import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Building2, Edit, Trash2, Users, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useSalonesQuery, useDeleteSalonMutation } from '../hooks/useEventos';
import { SalonFormModal } from './SalonFormModal';
import { textosEventos, formatearGTQ } from '../textos';
import type { Salon } from '../types';
import { getApiErrorMessage } from '@/api/errors';

export const AdminSalonesList: React.FC = () => {
  const salonesQuery = useSalonesQuery();
  const deleteMutation = useDeleteSalonMutation();

  const [salonEnEdicion, setSalonEnEdicion] = useState<Salon | null | undefined>(undefined);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const salones = salonesQuery.data ?? [];

  const handleDelete = async (id: number) => {
    if (!window.confirm(textosEventos.confirmarEliminarSalon)) return;
    setErrorAccion(null);
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: unknown) {
      setErrorAccion(getApiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-12">
      {/* Retorno al hub de servicios */}
      <Link
        to="/admin/servicios"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-bronce-700 transition-colors w-fit"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>Volver a servicios</span>
      </Link>

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosEventos.adminSalonesEyebrow}</p>
          <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
            {textosEventos.adminSalonesTitulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {textosEventos.adminSalonesDesc}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => setSalonEnEdicion(null)}
          className="inline-flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>{textosEventos.nuevoSalonBoton}</span>
        </Button>
      </div>

      {errorAccion && (
        <Alert tone="error" title="No fue posible completar la acción">
          {errorAccion}
        </Alert>
      )}

      {/* Estado de Carga y Error */}
      {salonesQuery.isPending && (
        <div className="flex justify-center py-16">
          <LoadingNotice label="Cargando salones..." />
        </div>
      )}

      {salonesQuery.isError && (
        <Card className="p-6">
          <Alert tone="error" title="Error al listar salones">
            {getApiErrorMessage(salonesQuery.error)}
          </Alert>
        </Card>
      )}

      {!salonesQuery.isPending && !salonesQuery.isError && (
        <>
          {salones.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <Building2 className="size-12 text-neutro-300 mb-3" aria-hidden="true" />
              <h2 className="text-base font-semibold text-neutro-800">
                No hay salones registrados
              </h2>
              <p className="mt-1 text-sm text-neutro-500">
                Haga clic en &quot;Nuevo salón&quot; para registrar el primer espacio para eventos.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {salones.map((salon) => (
                <Card
                  key={salon.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border border-neutro-200"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {salon.imagen_url ? (
                      <img
                        src={salon.imagen_url}
                        alt={salon.nombre}
                        className="size-16 rounded-xl object-cover border border-neutro-200 shrink-0"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-xl bg-selva-50 border border-selva-100 text-selva-700 shrink-0">
                        <Building2 className="size-7" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-serif font-bold text-neutro-900">
                          {salon.nombre}
                        </h2>
                        {salon.sucursal?.nombre && (
                          <span className="rounded-full bg-selva-50 px-2 py-0.5 text-xs font-semibold text-selva-700">
                            {salon.sucursal.nombre}
                          </span>
                        )}
                      </div>
                      {salon.descripcion && (
                        <p className="text-xs text-neutro-600 line-clamp-2 max-w-2xl">
                          {salon.descripcion}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-neutro-600 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3.5 text-neutro-400" />
                          Capacidad: {salon.capacidad_maxima} personas
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-neutro-800">
                          <Sparkles className="size-3.5 text-bronce-500" />
                          Tarifa base: {formatearGTQ(salon.tarifa_base)}
                        </span>
                        {salon.imagen_creditos?.autor && (
                          <span className="text-[10px] text-neutro-400">
                            Foto: {salon.imagen_creditos.autor}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutro-100 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSalonEnEdicion(salon)}
                      className="inline-flex items-center gap-1.5 text-xs"
                    >
                      <Edit className="size-3.5" aria-hidden="true" />
                      <span>{textosEventos.editarSalon}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(salon.id!)}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-rojo-600 hover:text-rojo-700 hover:bg-rojo-50"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only">{textosEventos.eliminarSalon}</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {salonEnEdicion !== undefined && (
        <SalonFormModal
          salon={salonEnEdicion}
          isOpen={true}
          onClose={() => setSalonEnEdicion(undefined)}
        />
      )}
    </div>
  );
};
