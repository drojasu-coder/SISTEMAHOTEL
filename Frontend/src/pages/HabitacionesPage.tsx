import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Bed, Layers, Car, CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Alert, LoadingNotice } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { hasPermission } from "@/features/auth/permissions";
import { useAdminScope } from "@/features/admin-core/AdminScopeContext";
import { es } from "@/i18n/es";
import { useSedesQuery } from "@/features/sedes/hooks/useSedes";
import {
  useHabitacionesQuery,
  useTiposHabitacionQuery,
} from "@/features/habitaciones/hooks/useHabitaciones";
import { HabitacionesList } from "@/features/habitaciones/components/HabitacionesList";
import { HabitacionesFilters } from "@/features/habitaciones/components/HabitacionesFilters";
import { HabitacionFormModal } from "@/features/habitaciones/components/HabitacionFormModal";
import { EstadoHabitacionModal } from "@/features/habitaciones/components/EstadoHabitacionModal";
import { textosHabitaciones } from "@/features/habitaciones/textos";
import type {
  Habitacion,
  HabitacionesFiltersState,
} from "@/features/habitaciones/types";
import { getApiErrorMessage } from "@/api/errors";

export const HabitacionesPage: React.FC = () => {
  const { user } = useAuth();
  const stateOnly = user?.rol === 'empleado_operativo';
  const { selectedSedeId } = useAdminScope();
  const canManageHabitaciones = user
    ? hasPermission(user.rol, "habitaciones.gestionar")
    : false;

  // La sede del selector global se aplica en el servidor; aquí solo se filtra por número y estado.
  const habitacionesQuery = useHabitacionesQuery(selectedSedeId);
  const tiposQuery = useTiposHabitacionQuery();
  const sedesQuery = useSedesQuery();

  const [filters, setFilters] = useState<HabitacionesFiltersState>({
    search: "",
    sucursalId: selectedSedeId ?? "all",
    estado: "all",
  });

  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    if (selectedSedeId !== undefined) {
      setFilters((prev) => ({
        ...prev,
        sucursalId: selectedSedeId,
      }));
    }
  }, [selectedSedeId]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

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

      // Filtro por estado
      if (filters.estado !== "all" && hab.estado !== filters.estado) {
        return false;
      }

      return true;
    });
  }, [habitaciones, filters]);

  const counts = useMemo(() => {
    const base = habitaciones;
    return {
      total: base.length,
      disponible: base.filter((h) => h.estado === "disponible").length,
      ocupada: base.filter((h) => h.estado === "ocupada").length,
      mantenimiento: base.filter((h) => h.estado === "mantenimiento").length,
      limpieza: base.filter((h) => h.estado === "limpieza").length,
    };
  }, [habitaciones]);

  const totalPages = Math.max(1, Math.ceil(filteredHabitaciones.length / pageSize));
  const paginatedHabitaciones = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHabitaciones.slice(start, start + pageSize);
  }, [filteredHabitaciones, page, pageSize]);

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
          {!stateOnly && <>
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
          </>}
          {canManageHabitaciones && !stateOnly && (
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

      {/* Tarjetas rápidas de estado físico (no equivale a disponibilidad por fechas) */}
      {!isLoading && !isError && habitaciones.length > 0 && (
        <p className="max-w-3xl text-xs text-neutro-600">{textosHabitaciones.notaEstadoFisico}</p>
      )}
      {!isLoading && !isError && habitaciones.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <button
            type="button"
            onClick={() => setFilters((p) => ({ ...p, estado: "all" }))}
            className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
              filters.estado === "all"
                ? "border-bronce-500 bg-bronce-50/70 shadow-xs ring-1 ring-bronce-500"
                : "border-neutro-200 bg-white hover:border-neutro-300"
            }`}
          >
            <span className="text-[11px] font-medium text-neutro-500 uppercase tracking-wider">Total</span>
            <span className="font-serif text-2xl font-bold text-neutro-900">{counts.total}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setFilters((p) => ({
                ...p,
                estado: p.estado === "disponible" ? "all" : "disponible",
              }))
            }
            className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
              filters.estado === "disponible"
                ? "border-exito-500 bg-exito-50 shadow-xs ring-1 ring-exito-500"
                : "border-neutro-200 bg-white hover:border-neutro-300"
            }`}
          >
            <span className="text-[11px] font-medium text-exito-700 uppercase tracking-wider">Libres (estado físico)</span>
            <span className="font-serif text-2xl font-bold text-exito-800">{counts.disponible}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setFilters((p) => ({
                ...p,
                estado: p.estado === "ocupada" ? "all" : "ocupada",
              }))
            }
            className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
              filters.estado === "ocupada"
                ? "border-info-500 bg-info-50 shadow-xs ring-1 ring-info-500"
                : "border-neutro-200 bg-white hover:border-neutro-300"
            }`}
          >
            <span className="text-[11px] font-medium text-info-700 uppercase tracking-wider">Ocupadas</span>
            <span className="font-serif text-2xl font-bold text-info-800">{counts.ocupada}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setFilters((p) => ({
                ...p,
                estado: p.estado === "mantenimiento" ? "all" : "mantenimiento",
              }))
            }
            className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
              filters.estado === "mantenimiento"
                ? "border-advertencia-500 bg-advertencia-50 shadow-xs ring-1 ring-advertencia-500"
                : "border-neutro-200 bg-white hover:border-neutro-300"
            }`}
          >
            <span className="text-[11px] font-medium text-advertencia-700 uppercase tracking-wider">Mantenimiento</span>
            <span className="font-serif text-2xl font-bold text-advertencia-800">{counts.mantenimiento}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setFilters((p) => ({
                ...p,
                estado: p.estado === "limpieza" ? "all" : "limpieza",
              }))
            }
            className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
              filters.estado === "limpieza"
                ? "border-bronce-500 bg-bronce-100 shadow-xs ring-1 ring-bronce-500"
                : "border-neutro-200 bg-white hover:border-neutro-300"
            }`}
          >
            <span className="text-[11px] font-medium text-bronce-800 uppercase tracking-wider">Limpieza</span>
            <span className="font-serif text-2xl font-bold text-bronce-900">{counts.limpieza}</span>
          </button>
        </div>
      )}

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
                setFilters((prev) => ({
                  ...prev,
                  search: "",
                  estado: "all",
                }))
              }
            >
              {textosHabitaciones.limpiarFiltros}
            </Button>
          </Card>
        )}

      {/* Listado de habitaciones */}
      {!isLoading && !isError && filteredHabitaciones.length > 0 && (
        <div className="flex flex-col gap-4">
          <HabitacionesList
            habitaciones={paginatedHabitaciones}
            sedesMap={sedesMap}
            tiposMap={tiposMap}
            canEdit={canManageHabitaciones}
            onEdit={handleOpenEdit}
          />

          {/* Barra de paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutro-200 pt-4 text-xs text-neutro-600">
              <span>
                Mostrando {(page - 1) * pageSize + 1} a{" "}
                {Math.min(page * pageSize, filteredHabitaciones.length)} de{" "}
                {filteredHabitaciones.length} habitaciones
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 text-xs"
                >
                  <ChevronLeft className="size-3.5" aria-hidden="true" />
                  <span>Anterior</span>
                </Button>
                <span className="px-2 font-medium text-neutro-900">
                  Página {page} de {totalPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 text-xs"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal accesible para creación y edición */}
      {canManageHabitaciones && !stateOnly && (
        <HabitacionFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          habitacion={selectedHabitacion}
          sedes={sedes}
          tiposHabitacion={tipos}
          onSuccess={handleSuccess}
        />
      )}
      {stateOnly && <EstadoHabitacionModal open={modalOpen} habitacion={selectedHabitacion} onClose={() => setModalOpen(false)} onSuccess={handleSuccess} />}
    </div>
  );
};
