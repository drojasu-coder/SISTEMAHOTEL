import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowLeft, CalendarCheck, Users } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Card } from '@/components/ui/Card';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useRecursosActividadQuery } from '@/features/actividades/hooks/useActividades';
import {
  RecursosActividadFilters,
  type RecursosActividadFiltersState,
} from '@/features/actividades/components/RecursosActividadFilters';
import { RecursosActividadList } from '@/features/actividades/components/RecursosActividadList';
import { RecursoActividadFormModal } from '@/features/actividades/components/RecursoActividadFormModal';
import { ACTIVIDADES_ROUTES } from '@/features/actividades/constants/routes';
import { textosActividades } from '@/features/actividades/textos';
import type { RecursoActividad } from '@/features/actividades/types';
import { getApiErrorMessage } from '@/api/errors';
import { es } from '@/i18n/es';

export const AdminRecursosActividadPage: React.FC = () => {
  const recursosQuery = useRecursosActividadQuery();
  const sedesQuery = useSedesQuery();

  const [filters, setFilters] = useState<RecursosActividadFiltersState>({
    search: '',
    sucursalId: 'all',
    tipo: 'all',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecurso, setSelectedRecurso] = useState<RecursoActividad | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const sedes = sedesQuery.data ?? [];
  const recursos = recursosQuery.data ?? [];

  const tiposDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const r of recursos) {
      if (r.tipo) set.add(r.tipo.toLowerCase());
    }
    return Array.from(set).sort();
  }, [recursos]);

  const filteredRecursos = useMemo(() => {
    return recursos.filter((item) => {
      // Búsqueda por texto (nombre o tipo)
      const term = filters.search.trim().toLowerCase();
      if (term) {
        const matchesNombre = (item.nombre || "").toLowerCase().includes(term);
        const matchesTipo = (item.tipo || "").toLowerCase().includes(term);
        if (!matchesNombre && !matchesTipo) return false;
      }

      // Filtro por sede
      if (filters.sucursalId !== 'all') {
        if (String(item.sucursal_id) !== filters.sucursalId) return false;
      }

      // Filtro por tipo
      if (filters.tipo !== 'all') {
        if ((item.tipo || "").toLowerCase() !== filters.tipo) return false;
      }

      return true;
    });
  }, [recursos, filters]);

  const handleOpenCreate = () => {
    setSelectedRecurso(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: RecursoActividad) => {
    setSelectedRecurso(item);
    setModalOpen(true);
  };

  const handleSuccess = (msg: string) => {
    setFeedbackMessage(msg);
  };

  const isLoading = recursosQuery.isLoading || sedesQuery.isLoading;
  const isError = recursosQuery.isError || sedesQuery.isError;
  const errorObj = recursosQuery.error || sedesQuery.error;

  const handleRefetch = () => {
    void recursosQuery.refetch();
    void sedesQuery.refetch();
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosActividades.adminSubtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem] text-neutro-900">
            {textosActividades.adminRecursosTitulo}
          </h1>
          <p className="text-sm text-neutro-600 max-w-2xl">
            {textosActividades.adminRecursosDesc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          <Link to="/admin/servicios" className={buttonStyles({ variant: 'ghost' })}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{es.servicios.titulo}</span>
          </Link>

          <Link
            to={ACTIVIDADES_ROUTES.ADMIN_INSTRUCTORES}
            className={buttonStyles({ variant: 'secondary' })}
          >
            <Users className="size-4" aria-hidden="true" />
            <span>{textosActividades.adminInstructoresTitulo}</span>
          </Link>

          <Link
            to={ACTIVIDADES_ROUTES.ADMIN_RESERVAS}
            className={buttonStyles({ variant: 'secondary' })}
          >
            <CalendarCheck className="size-4" aria-hidden="true" />
            <span>Reservas</span>
          </Link>

          <Button
            type="button"
            variant="primary"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>{textosActividades.nuevoRecurso}</span>
          </Button>
        </div>
      </div>

      {feedbackMessage && (
        <Alert tone="success">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">{feedbackMessage}</p>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-semibold text-exito-700 hover:underline"
            >
              Cerrar
            </button>
          </div>
        </Alert>
      )}

      {/* Estados de carga y error */}
      {isLoading && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <LoadingNotice label="Cargando recursos e instalaciones..." />
        </Card>
      )}

      {isError && (
        <Alert tone="error" title="No fue posible cargar los recursos de actividad">
          <div className="flex flex-col gap-3">
            <p className="text-xs">{getApiErrorMessage(errorObj)}</p>
            <div>
              <Button type="button" variant="ghost" size="sm" onClick={handleRefetch}>
                {textosActividades.reintentar}
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Contenido principal */}
      {!isLoading && !isError && (
        <div className="flex flex-col gap-6">
          <Card className="p-4 sm:p-5">
            <RecursosActividadFilters
              filters={filters}
              onChange={setFilters}
              sedes={sedes}
              tiposDisponibles={tiposDisponibles}
            />
          </Card>

          <RecursosActividadList recursos={filteredRecursos} onEdit={handleOpenEdit} />
        </div>
      )}

      {/* Modal para Crear/Editar */}
      <RecursoActividadFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        recurso={selectedRecurso}
        sedes={sedes}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
