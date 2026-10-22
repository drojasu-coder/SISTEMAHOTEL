import React, { useMemo, useState } from 'react';
import { Plus, Search, X, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/AuthContext';
import { hasPermission } from '@/features/auth/permissions';
import { es } from '@/i18n/es';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { SedesList } from '@/features/sedes/components/SedesList';
import { SedeFormModal } from '@/features/sedes/components/SedeFormModal';
import { SedeStatusDialog } from '@/features/sedes/components/SedeStatusDialog';
import type { Sucursal } from '@/features/sedes/types';
import { getApiErrorMessage } from '@/api/errors';

export const SedesPage: React.FC = () => {
  const { user } = useAuth();
  const canManageSedes = user ? hasPermission(user.rol, 'configuracion.administrar') : false;

  const { data: sedes, isLoading, isError, error, refetch } = useSedesQuery();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSede, setSelectedSede] = useState<Sucursal | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusSede, setStatusSede] = useState<Sucursal | null>(null);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const filteredSedes = useMemo(() => {
    if (!sedes) return [];
    const term = search.trim().toLowerCase();
    if (!term) return sedes;
    return sedes.filter((s) => {
      const matchNombre = s.nombre.toLowerCase().includes(term);
      const matchCiudad = s.ciudad ? s.ciudad.toLowerCase().includes(term) : false;
      const matchDireccion = s.direccion ? s.direccion.toLowerCase().includes(term) : false;
      return matchNombre || matchCiudad || matchDireccion;
    });
  }, [sedes, search]);

  const handleOpenCreate = () => {
    setSelectedSede(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (sede: Sucursal) => {
    setSelectedSede(sede);
    setModalOpen(true);
  };

  const handleOpenStatusDialog = (sede: Sucursal) => {
    setStatusSede(sede);
    setStatusDialogOpen(true);
  };

  const handleSuccess = (msg: string) => {
    setFeedbackMessage(msg);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{es.modulos.configuracion}</p>
          <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem] text-neutro-900">
            {es.sedes.titulo}
          </h1>
          <p className="text-sm text-neutro-600 max-w-2xl">
            {es.sedes.descripcion}
          </p>
        </div>

        {canManageSedes && (
          <Button
            type="button"
            variant="primary"
            onClick={handleOpenCreate}
            className="self-start sm:self-center"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>{es.sedes.nuevaSede}</span>
          </Button>
        )}
      </div>

      {/* Mensaje de confirmación o alerta temporal */}
      {feedbackMessage && (
        <Alert tone="success">
          <div className="flex items-center justify-between gap-4">
            <span>{feedbackMessage}</span>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              {es.comunes.cerrar}
            </button>
          </div>
        </Alert>
      )}

      {/* Barra de búsqueda (visible cuando hay o hubo datos cargados) */}
      {!isLoading && !isError && sedes && sedes.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutro-500"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label={es.sedes.buscarLabel}
              placeholder={es.sedes.buscarPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-control pl-10 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={es.sedes.limpiarBusqueda}
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-neutro-500 hover:bg-neutro-100 hover:text-neutro-900"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <span className="text-xs text-neutro-500">
            {filteredSedes.length} {filteredSedes.length === 1 ? 'sede mostrada' : 'sedes mostradas'}
          </span>
        </div>
      )}

      {/* Estados principales */}
      {isLoading && (
        <div className="py-12 flex justify-center">
          <LoadingNotice label={es.comunes.cargando} />
        </div>
      )}

      {isError && (
        <Card className="flex flex-col items-start gap-4">
          <Alert tone="error" title={es.sedes.errorCargar}>
            {getApiErrorMessage(error)}
          </Alert>
          <Button type="button" variant="ghost" onClick={() => refetch()}>
            {es.comunes.reintentar}
          </Button>
        </Card>
      )}

      {!isLoading && !isError && sedes && sedes.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Building2 className="size-12 text-neutro-400" aria-hidden="true" />
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="text-lg font-serif font-semibold text-neutro-800">
              {es.sedes.sinSedes}
            </h2>
            <p className="text-xs text-neutro-600">
              {canManageSedes
                ? 'Comience registrando la primera sede del hotel mediante el botón superior.'
                : 'No se encontraron sedes disponibles en este momento.'}
            </p>
          </div>
          {canManageSedes && (
            <Button type="button" variant="primary" onClick={handleOpenCreate}>
              <Plus className="size-4" aria-hidden="true" />
              {es.sedes.nuevaSede}
            </Button>
          )}
        </Card>
      )}

      {!isLoading && !isError && sedes && sedes.length > 0 && filteredSedes.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <p className="text-sm text-neutro-700">{es.sedes.sinResultados}</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSearch('')}>
            {es.sedes.limpiarBusqueda}
          </Button>
        </Card>
      )}

      {!isLoading && !isError && filteredSedes.length > 0 && (
        <SedesList
          sedes={filteredSedes}
          canEdit={canManageSedes}
          onEdit={handleOpenEdit}
          onToggleStatus={handleOpenStatusDialog}
        />
      )}

      {/* Modales */}
      {canManageSedes && (
        <>
          <SedeFormModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            sede={selectedSede}
            onSuccess={handleSuccess}
          />
          <SedeStatusDialog
            open={statusDialogOpen}
            onClose={() => setStatusDialogOpen(false)}
            sede={statusSede}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );
};
