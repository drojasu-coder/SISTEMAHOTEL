import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Bed, Layers, Car, CalendarCheck } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Alert, LoadingNotice } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { hasPermission } from "@/features/auth/permissions";
import { es } from "@/i18n/es";
import { useSedesQuery } from "@/features/sedes/hooks/useSedes";
import {
  useHabitacionesQuery,
  useTiposHabitacionQuery,
} from "@/features/habitaciones/hooks/useHabitaciones";
import { HabitacionesList } from "@/features/habitaciones/components/HabitacionesList";
import { HabitacionesFilters } from "@/features/habitaciones/components/HabitacionesFilters";
import { HabitacionFormModal } from "@/features/habitaciones/components/HabitacionFormModal";
import { textosHabitaciones } from "@/features/habitaciones/textos";
import type {
  Habitacion,
  HabitacionesFiltersState,
} from "@/features/habitaciones/types";
import { getApiErrorMessage } from "@/api/errors";

export const HabitacionesPage: React.FC = () => {
  const { user } = useAuth();
  const canManageHabitaciones = user
    ? hasPermission(user.rol, "habitaciones.gestionar")
    : false;

  const habitacionesQuery = useHabitacionesQuery();
  const tiposQuery = useTiposHabitacionQuery();
  const sedesQuery = useSedesQuery();

  const [filters, setFilters] = useState<HabitacionesFiltersState>({
    search: "",
    sucursalId: "all",
    estado: "all",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHabitacion, setSelectedHabitacion] =
    useState<Habitacion | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const sedes = sedesQuery.data ?? [];
  const tipos = tiposQuery.data ?? [];
  const habitaciones = habitacionesQuery.data ?? [];

  const sedesMap = useMemo(
    () => new Map(sedes.map((s) => [s.id, s])),
    [sedes]
  );

  const tiposMap = useMemo(
    () => new Map(tipos.map((t) => [t.id, t])),
    [tipos]
  );

  const filteredHabitaciones = useMemo(() => {
    return habitaciones.filter((hab) => {
      // Filtro por número de habitación
      const term = filters.search.trim().toLowerCase();
      if (term && !hab.numero.toLowerCase().includes(term)) {
        return false;
      }

      // Filtro por sede
      if (
        filters.sucursalId !== "all" &&
        hab.sucursal_id !== filters.sucursalId
      ) {
        return false;
      }

      // Filtro por estado
      if (filters.estado !== "all" && hab.estado !== filters.estado) {
        return false;
      }

      return true;
    });
  }, [habitaciones, filters]);

  const handleOpenCreate = () => {
    setSelectedHabitacion(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (hab: Habitacion) => {
    setSelectedHabitacion(hab);
    setModalOpen(true);
  };

  const handleSuccess = (msg: string) => {
    setFeedbackMessage(msg);
  };

  const isLoading =
    habitacionesQuery.isLoading || tiposQuery.isLoading || sedesQuery.isLoading;

  const isError =
    habitacionesQuery.isError || tiposQuery.isError || sedesQuery.isError;

  const errorObj =
    habitacionesQuery.error || tiposQuery.error || sedesQuery.error;

  const handleRefetch = () => {
    habitacionesQuery.refetch();
    tiposQuery.refetch();
    sedesQuery.refetch();
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosHabitaciones.subtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem] text-neutro-900">
            {textosHabitaciones.titulo}
          </h1>
          <p className="text-sm text-neutro-600 max-w-2xl">
            {textosHabitaciones.descripcion}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          <Link
            to="/admin/reservas"
            className={buttonStyles({ variant: "ghost" })}
          >
            <CalendarCheck className="size-4" aria-hidden="true" />
            <span>Reservas</span>
          </Link>
          <Link
            to="/admin/tipos-habitacion"
            className={buttonStyles({ variant: "ghost" })}
          >
            <Layers className="size-4" aria-hidden="true" />
            <span>{es.tiposHabitacion.titulo}</span>
          </Link>
          <Link
            to="/admin/parqueos"
            className={buttonStyles({ variant: "ghost" })}
          >
            <Car className="size-4" aria-hidden="true" />
            <span>{es.parqueos.titulo}</span>
          </Link>
          {canManageHabitaciones && (
            <Button
              type="button"
              variant="primary"
              onClick={handleOpenCreate}
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>{textosHabitaciones.nuevaHabitacion}</span>
            </Button>
          )}
        </div>
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

      {/* Barra de búsqueda y filtros */}
      {!isLoading && !isError && habitaciones.length > 0 && (
        <HabitacionesFilters
          filters={filters}
          onChange={setFilters}
          sedes={sedes}
          totalResults={filteredHabitaciones.length}
        />
      )}

      {/* Estados principales */}
      {isLoading && (
        <div className="py-12 flex justify-center">
          <LoadingNotice label={textosHabitaciones.cargando} />
        </div>
      )}

      {isError && (
        <Card className="flex flex-col items-start gap-4">
          <Alert tone="error" title={textosHabitaciones.errorCargar}>
            {getApiErrorMessage(errorObj)}
          </Alert>
          <Button type="button" variant="ghost" onClick={handleRefetch}>
            {es.comunes.reintentar}
          </Button>
        </Card>
      )}

      {/* Catálogo completamente vacío */}
      {!isLoading && !isError && habitaciones.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Bed className="size-12 text-neutro-400" aria-hidden="true" />
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="text-lg font-serif font-semibold text-neutro-800">
              {textosHabitaciones.sinHabitacionesTitulo}
            </h2>
            <p className="text-xs text-neutro-600">
              {canManageHabitaciones
                ? textosHabitaciones.sinHabitacionesDescAdmin
                : textosHabitaciones.sinHabitacionesDescLectura}
            </p>
          </div>
          {canManageHabitaciones && (
            <Button type="button" variant="primary" onClick={handleOpenCreate}>
              <Plus className="size-4" aria-hidden="true" />
              {textosHabitaciones.nuevaHabitacion}
            </Button>
          )}
        </Card>
      )}

      {/* Búsqueda o filtros sin resultados */}
      {!isLoading &&
        !isError &&
        habitaciones.length > 0 &&
        filteredHabitaciones.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-sm text-neutro-700">
              {textosHabitaciones.sinResultados}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setFilters({
                  search: "",
                  sucursalId: "all",
                  estado: "all",
                })
              }
            >
              {textosHabitaciones.limpiarFiltros}
            </Button>
          </Card>
        )}

      {/* Listado de habitaciones */}
      {!isLoading && !isError && filteredHabitaciones.length > 0 && (
        <HabitacionesList
          habitaciones={filteredHabitaciones}
          sedesMap={sedesMap}
          tiposMap={tiposMap}
          canEdit={canManageHabitaciones}
          onEdit={handleOpenEdit}
        />
      )}

      {/* Modal accesible para creación y edición */}
      {canManageHabitaciones && (
        <HabitacionFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          habitacion={selectedHabitacion}
          sedes={sedes}
          tiposHabitacion={tipos}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
