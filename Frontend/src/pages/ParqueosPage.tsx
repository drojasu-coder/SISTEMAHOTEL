import React, { useMemo, useState } from "react";
import { Plus, ParkingCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert, LoadingNotice } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { hasPermission } from "@/features/auth/permissions";
import { es } from "@/i18n/es";
import { useSedesQuery } from "@/features/sedes/hooks/useSedes";
import { useParqueosQuery } from "@/features/parqueos/hooks/useParqueos";
import { ParqueosFilters } from "@/features/parqueos/components/ParqueosFilters";
import { ParqueosList } from "@/features/parqueos/components/ParqueosList";
import { ParqueoFormModal } from "@/features/parqueos/components/ParqueoFormModal";
import { textosParqueos } from "@/features/parqueos/textos";
import type { Parqueo, ParqueosFiltersState } from "@/features/parqueos/types";
import { getApiErrorMessage } from "@/api/errors";

export const ParqueosPage: React.FC = () => {
  const { user } = useAuth();
  // El backend exige admin, recepcionista o gerente_habitaciones para crear y
  // editar parqueos; la lectura solo exige sesión iniciada.
  const canManageParqueos = user
    ? hasPermission(user.rol, "habitaciones.gestionar")
    : false;

  const parqueosQuery = useParqueosQuery();
  const sedesQuery = useSedesQuery();

  const [filters, setFilters] = useState<ParqueosFiltersState>({
    search: "",
    sucursalId: "all",
    estado: "all",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedParqueo, setSelectedParqueo] = useState<Parqueo | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const parqueos = parqueosQuery.data ?? [];
  const sedes = sedesQuery.data ?? [];

  const sedesMap = useMemo(
    () => new Map(sedes.map((sede) => [sede.id, sede])),
    [sedes]
  );

  const filteredParqueos = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return parqueos.filter((parqueo) => {
      if (term && !parqueo.numero.toLowerCase().includes(term)) {
        return false;
      }
      if (
        filters.sucursalId !== "all" &&
        parqueo.sucursal_id !== filters.sucursalId
      ) {
        return false;
      }
      if (filters.estado !== "all" && parqueo.estado !== filters.estado) {
        return false;
      }
      return true;
    });
  }, [parqueos, filters]);

  const handleOpenCreate = () => {
    setSelectedParqueo(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (parqueo: Parqueo) => {
    setSelectedParqueo(parqueo);
    setModalOpen(true);
  };

  const handleSuccess = (message: string) => {
    setFeedbackMessage(message);
  };

  const handleClearFilters = () => {
    setFilters({ search: "", sucursalId: "all", estado: "all" });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosParqueos.subtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem] text-neutro-900">
            {textosParqueos.titulo}
          </h1>
          <p className="text-sm text-neutro-600 max-w-2xl">
            {textosParqueos.descripcion}
          </p>
        </div>

        {canManageParqueos && (
          <Button type="button" variant="primary" onClick={handleOpenCreate}>
            <Plus className="size-4" aria-hidden="true" />
            <span>{textosParqueos.nuevoParqueo}</span>
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

      {/* Catálogo de sedes no disponible: el listado sigue siendo utilizable */}
      {!parqueosQuery.isLoading &&
        !parqueosQuery.isError &&
        sedesQuery.isError && (
          <Alert tone="warning">{textosParqueos.errorCatalogoSedes}</Alert>
        )}

      {/* Barra de búsqueda y filtros */}
      {!parqueosQuery.isLoading &&
        !parqueosQuery.isError &&
        parqueos.length > 0 && (
          <ParqueosFilters
            filters={filters}
            onChange={setFilters}
            sedes={sedes}
            totalResults={filteredParqueos.length}
          />
        )}

      {/* Estados principales */}
      {parqueosQuery.isLoading && (
        <div className="py-12 flex justify-center">
          <LoadingNotice label={textosParqueos.cargando} />
        </div>
      )}

      {parqueosQuery.isError && (
        <Card className="flex flex-col items-start gap-4">
          <Alert tone="error" title={textosParqueos.errorCargar}>
            {getApiErrorMessage(parqueosQuery.error)}
          </Alert>
          <Button type="button" variant="ghost" onClick={() => parqueosQuery.refetch()}>
            {es.comunes.reintentar}
          </Button>
        </Card>
      )}

      {/* Catálogo completamente vacío */}
      {!parqueosQuery.isLoading &&
        !parqueosQuery.isError &&
        parqueos.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <ParkingCircle className="size-12 text-neutro-400" aria-hidden="true" />
            <div className="flex flex-col gap-1 max-w-md">
              <h2 className="text-lg font-serif font-semibold text-neutro-800">
                {textosParqueos.sinParqueosTitulo}
              </h2>
              <p className="text-xs text-neutro-600">
                {canManageParqueos
                  ? textosParqueos.sinParqueosDescAdmin
                  : textosParqueos.sinParqueosDescLectura}
              </p>
            </div>
            {canManageParqueos && (
              <Button type="button" variant="primary" onClick={handleOpenCreate}>
                <Plus className="size-4" aria-hidden="true" />
                {textosParqueos.nuevoParqueo}
              </Button>
            )}
          </Card>
        )}

      {/* Búsqueda o filtros sin resultados */}
      {!parqueosQuery.isLoading &&
        !parqueosQuery.isError &&
        parqueos.length > 0 &&
        filteredParqueos.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-sm text-neutro-700">{textosParqueos.sinResultados}</p>
            <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters}>
              {textosParqueos.limpiarFiltros}
            </Button>
          </Card>
        )}

      {/* Listado de espacios de parqueo */}
      {!parqueosQuery.isLoading &&
        !parqueosQuery.isError &&
        filteredParqueos.length > 0 && (
          <ParqueosList
            parqueos={filteredParqueos}
            sedesMap={sedesMap}
            canEdit={canManageParqueos}
            onEdit={handleOpenEdit}
          />
        )}

      {/* Modal accesible para creación y edición */}
      {canManageParqueos && (
        <ParqueoFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          parqueo={selectedParqueo}
          sedes={sedes}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
