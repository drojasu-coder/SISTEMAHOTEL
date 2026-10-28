import React, { useMemo, useState } from "react";
import { Plus, BedDouble } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert, LoadingNotice } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { hasPermission } from "@/features/auth/permissions";
import { useAdminScope } from "@/features/admin-core/AdminScopeContext";
import { useAdminSedes } from "@/features/admin-core/hooks/useAdminSedes";
import { useTiposHabitacionQuery } from "@/features/tipos-habitacion/hooks/useTiposHabitacion";
import { TiposHabitacionList } from "@/features/tipos-habitacion/components/TiposHabitacionList";
import { TiposHabitacionFilters } from "@/features/tipos-habitacion/components/TiposHabitacionFilters";
import { TipoHabitacionFormModal } from "@/features/tipos-habitacion/components/TipoHabitacionFormModal";
import { useTiposHabitacionTexts } from "@/features/tipos-habitacion/textos";
import type {
  TipoHabitacion,
  TiposHabitacionFiltersState,
} from "@/features/tipos-habitacion/types";
import { getApiErrorMessage } from "@/api/errors";

export const TiposHabitacionPage: React.FC = () => {
  const textosTiposHabitacion = useTiposHabitacionTexts();
  const { selectedSedeId, setSelectedSedeId } = useAdminScope();
  const { user } = useAuth();
  const canManageTipos = user
    ? hasPermission(user.rol, "habitaciones.gestionar")
    : false;
  const authorized = useAdminSedes(canManageTipos);
  const canEditTipo = (tipo: TipoHabitacion) => canManageTipos && authorized.isSuccess && (
    tipo.sucursal_id === null ? user?.rol === 'admin' && authorized.data?.global === true
      : authorized.data?.sedes.some(site => site.id === tipo.sucursal_id) === true
  );

  const { data: tipos, isLoading, isError, error, refetch } =
    useTiposHabitacionQuery(Boolean(user));

  const [filters, setFilters] = useState<TiposHabitacionFiltersState>({
    search: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoHabitacion | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const filteredTipos = useMemo(() => {
    if (!tipos) return [];
    const term = filters.search.trim().toLowerCase();
    return tipos.filter(tipo => (selectedSedeId === 'all' || tipo.sucursal_id === null || tipo.sucursal_id === selectedSedeId)
      && (!term || tipo.nombre.toLowerCase().includes(term)));
  }, [tipos, filters.search, selectedSedeId]);

  const handleOpenCreate = () => {
    setSelectedTipo(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tipo: TipoHabitacion) => {
    if (!canEditTipo(tipo)) return;
    setSelectedTipo(tipo);
    setModalOpen(true);
  };

  const handleSuccess = (msg: string) => {
    setFeedbackMessage(msg);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1.5">
          <p className="eyebrow">{textosTiposHabitacion.subtitulo}</p>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900 sm:text-3xl">
            {textosTiposHabitacion.titulo}
          </h1>
          <p className="text-sm text-neutro-600 max-w-2xl">
            {textosTiposHabitacion.descripcion}
          </p>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-3 self-start">
          {canManageTipos && (
            <Button
              type="button"
              variant="primary"
              onClick={handleOpenCreate}
              disabled={authorized.isLoading || authorized.isError}
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>{textosTiposHabitacion.nuevoTipo}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Alerta de confirmación */}
      {feedbackMessage && (
        <Alert tone="success">
          <div className="flex items-center justify-between gap-4">
            <span>{feedbackMessage}</span>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              {textosTiposHabitacion.cerrar}
            </button>
          </div>
        </Alert>
      )}

      {canManageTipos && authorized.isError && <Alert tone="error">{textosTiposHabitacion.scopeError}
        <Button variant="text" onClick={() => void authorized.refetch()}>{textosTiposHabitacion.retry}</Button>
      </Alert>}
      <p className="text-xs text-neutro-600">{textosTiposHabitacion.siteNote}</p>

      {/* Barra de búsqueda */}
      {!isLoading && !isError && tipos && tipos.length > 0 && (
        <TiposHabitacionFilters
          filters={filters}
          onChange={setFilters}
          totalResults={filteredTipos.length}
        />
      )}

      {/* Carga */}
      {isLoading && (
        <div className="py-12 flex justify-center">
          <LoadingNotice label={textosTiposHabitacion.cargando} />
        </div>
      )}

      {/* Error */}
      {isError && (
        <Card className="flex flex-col items-start gap-4">
          <Alert tone="error" title={textosTiposHabitacion.errorCargar}>
            {getApiErrorMessage(error)}
          </Alert>
          <Button type="button" variant="ghost" onClick={() => refetch()}>
            {textosTiposHabitacion.retry}
          </Button>
        </Card>
      )}

      {/* Catálogo vacío */}
      {!isLoading && !isError && tipos && tipos.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <BedDouble className="size-12 text-neutro-400" aria-hidden="true" />
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="font-sans text-lg font-semibold text-neutro-800">
              {textosTiposHabitacion.sinTiposTitulo}
            </h2>
            <p className="text-xs text-neutro-600">
              {canManageTipos
                ? textosTiposHabitacion.sinTiposDescAdmin
                : textosTiposHabitacion.sinTiposDescLectura}
            </p>
          </div>
          {canManageTipos && (
            <Button type="button" variant="primary" onClick={handleOpenCreate} disabled={authorized.isLoading || authorized.isError}>
              <Plus className="size-4" aria-hidden="true" />
              {textosTiposHabitacion.nuevoTipo}
            </Button>
          )}
        </Card>
      )}

      {/* Búsqueda sin resultados */}
      {!isLoading &&
        !isError &&
        tipos &&
        tipos.length > 0 &&
        filteredTipos.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-sm text-neutro-700">
              {textosTiposHabitacion.sinResultados}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setFilters({ search: "" }); setSelectedSedeId('all'); }}
            >
              {textosTiposHabitacion.limpiarFiltros}
            </Button>
          </Card>
        )}

      {/* Listado */}
      {!isLoading && !isError && filteredTipos.length > 0 && (
        <TiposHabitacionList
          tipos={filteredTipos}
          canEdit={canManageTipos && authorized.isSuccess}
          isEditable={canEditTipo}
          sedes={authorized.data?.sedes ?? []}
          onEdit={handleOpenEdit}
        />
      )}

      {/* Modal */}
      {canManageTipos && (
        <TipoHabitacionFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          tipo={selectedTipo}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
