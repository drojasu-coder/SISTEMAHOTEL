import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Sparkles, ArrowLeft } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Alert, LoadingNotice } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { hasPermission } from "@/features/auth/permissions";
import { es } from "@/i18n/es";
import { useSedesQuery } from "@/features/sedes/hooks/useSedes";
import { useAmenidadesQuery } from "@/features/amenidades/hooks/useAmenidades";
import { AmenidadesList } from "@/features/amenidades/components/AmenidadesList";
import { AmenidadesFilters } from "@/features/amenidades/components/AmenidadesFilters";
import { AmenidadFormModal } from "@/features/amenidades/components/AmenidadFormModal";
import { textosAmenidades } from "@/features/amenidades/textos";
import type { Amenidad, AmenidadesFiltersState } from "@/features/amenidades/types";
import { getApiErrorMessage } from "@/api/errors";

export const AmenidadesPage: React.FC = () => {
  const { user } = useAuth();
  const canManageAmenidades = user
    ? hasPermission(user.rol, "servicios.administrar")
    : false;

  const amenidadesQuery = useAmenidadesQuery();
  const sedesQuery = useSedesQuery();

  const [filters, setFilters] = useState<AmenidadesFiltersState>({
    search: "",
    sucursalId: "all",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAmenidad, setSelectedAmenidad] = useState<Amenidad | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const sedes = sedesQuery.data ?? [];
  const amenidades = amenidadesQuery.data ?? [];

  const sedesMap = useMemo(
    () => new Map(sedes.map((s) => [s.id, s])),
    [sedes]
  );

  const filteredAmenidades = useMemo(() => {
    return amenidades.filter((item) => {
      // Filtro por nombre
      const term = filters.search.trim().toLowerCase();
      if (term && !item.nombre.toLowerCase().includes(term)) {
        return false;
      }

      // Filtro por sede
      if (
        filters.sucursalId !== "all" &&
        item.sucursal_id !== filters.sucursalId
      ) {
        return false;
      }

      return true;
    });
  }, [amenidades, filters]);

  const handleOpenCreate = () => {
    setSelectedAmenidad(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: Amenidad) => {
    setSelectedAmenidad(item);
    setModalOpen(true);
  };

  const handleSuccess = (msg: string) => {
    setFeedbackMessage(msg);
  };

  const isLoading = amenidadesQuery.isLoading || sedesQuery.isLoading;
  const isError = amenidadesQuery.isError || sedesQuery.isError;
  const errorObj = amenidadesQuery.error || sedesQuery.error;

  const handleRefetch = () => {
    amenidadesQuery.refetch();
    sedesQuery.refetch();
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosAmenidades.modulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem] text-neutro-900">
            {textosAmenidades.titulo}
          </h1>
          <p className="text-sm text-neutro-600 max-w-2xl">
            {textosAmenidades.descripcion}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          <Link
            to="/admin/servicios"
            className={buttonStyles({ variant: "ghost" })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{es.servicios.titulo}</span>
          </Link>
          {canManageAmenidades && (
            <Button
              type="button"
              variant="primary"
              onClick={handleOpenCreate}
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>{textosAmenidades.nuevaAmenidad}</span>
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
              {es.comunes.cerrar}
            </button>
          </div>
        </Alert>
      )}

      {/* Barra de búsqueda y filtros */}
      {!isLoading && !isError && amenidades.length > 0 && (
        <AmenidadesFilters
          filters={filters}
          onChange={setFilters}
          sedes={sedes}
          totalResults={filteredAmenidades.length}
        />
      )}

      {/* Estados principales: Carga */}
      {isLoading && (
        <div className="py-12 flex justify-center">
          <LoadingNotice label={textosAmenidades.cargando} />
        </div>
      )}

      {/* Error con reintento */}
      {isError && (
        <Card className="flex flex-col items-start gap-4">
          <Alert tone="error" title={textosAmenidades.errorCargar}>
            {getApiErrorMessage(errorObj)}
          </Alert>
          <Button type="button" variant="ghost" onClick={handleRefetch}>
            {es.comunes.reintentar}
          </Button>
        </Card>
      )}

      {/* Catálogo vacío */}
      {!isLoading && !isError && amenidades.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Sparkles className="size-12 text-neutro-400" aria-hidden="true" />
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="text-lg font-serif font-semibold text-neutro-800">
              {textosAmenidades.sinAmenidadesTitulo}
            </h2>
            <p className="text-xs text-neutro-600">
              {canManageAmenidades
                ? textosAmenidades.sinAmenidadesDescAdmin
                : textosAmenidades.sinAmenidadesDescLectura}
            </p>
          </div>
          {canManageAmenidades && (
            <Button type="button" variant="primary" onClick={handleOpenCreate}>
              <Plus className="size-4" aria-hidden="true" />
              {textosAmenidades.nuevaAmenidad}
            </Button>
          )}
        </Card>
      )}

      {/* Sin resultados tras filtrar */}
      {!isLoading &&
        !isError &&
        amenidades.length > 0 &&
        filteredAmenidades.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-sm text-neutro-700">
              {textosAmenidades.sinResultados}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setFilters({
                  search: "",
                  sucursalId: "all",
                })
              }
            >
              {textosAmenidades.limpiarFiltros}
            </Button>
          </Card>
        )}

      {/* Listado */}
      {!isLoading && !isError && filteredAmenidades.length > 0 && (
        <AmenidadesList
          amenidades={filteredAmenidades}
          sedesMap={sedesMap}
          canEdit={canManageAmenidades}
          onEdit={handleOpenEdit}
        />
      )}

      {/* Modal accesible */}
      {canManageAmenidades && (
        <AmenidadFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          amenidad={selectedAmenidad}
          sedes={sedes}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
