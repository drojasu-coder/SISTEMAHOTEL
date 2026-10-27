import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowLeft, Tag, CalendarCheck } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Card } from '@/components/ui/Card';
import { useInstructoresQuery } from '@/features/actividades/hooks/useActividades';
import {
  InstructoresFilters,
  type InstructoresFiltersState,
} from '@/features/actividades/components/InstructoresFilters';
import { InstructoresList } from '@/features/actividades/components/InstructoresList';
import { InstructorFormModal } from '@/features/actividades/components/InstructorFormModal';
import { ACTIVIDADES_ROUTES } from '@/features/actividades/constants/routes';
import { textosActividades } from '@/features/actividades/textos';
import type { Instructor } from '@/features/actividades/types';
import { getApiErrorMessage } from '@/api/errors';
import { es } from '@/i18n/es';

export const AdminInstructoresPage: React.FC = () => {
  const instructoresQuery = useInstructoresQuery();

  const [filters, setFilters] = useState<InstructoresFiltersState>({
    search: '',
    estado: 'all',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const instructores = instructoresQuery.data ?? [];

  const filteredInstructores = useMemo(() => {
    return instructores.filter((item) => {
      // Búsqueda por texto (nombre o especialidad)
      const term = filters.search.trim().toLowerCase();
      if (term) {
        const matchesNombre = item.nombre ? item.nombre.toLowerCase().includes(term) : false;
        const matchesEsp = item.especialidad ? item.especialidad.toLowerCase().includes(term) : false;
        if (!matchesNombre && !matchesEsp) return false;
      }

      // Filtro por estado activo/inactivo
      if (filters.estado === 'activo' && !item.activo) return false;
      if (filters.estado === 'inactivo' && item.activo) return false;

      return true;
    });
  }, [instructores, filters]);

  const handleOpenCreate = () => {
    setSelectedInstructor(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: Instructor) => {
    setSelectedInstructor(item);
    setModalOpen(true);
  };

  const handleSuccess = (msg: string) => {
    setFeedbackMessage(msg);
  };

  const isLoading = instructoresQuery.isLoading;
  const isError = instructoresQuery.isError;
  const errorObj = instructoresQuery.error;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosActividades.adminSubtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem] text-neutro-900">
            {textosActividades.adminInstructoresTitulo}
          </h1>
          <p className="text-sm text-neutro-600 max-w-2xl">
            {textosActividades.adminInstructoresDesc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          <Link to="/admin/servicios" className={buttonStyles({ variant: 'ghost' })}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{es.servicios.titulo}</span>
          </Link>

          <Link
            to={ACTIVIDADES_ROUTES.ADMIN_RECURSOS}
            className={buttonStyles({ variant: 'secondary' })}
          >
            <Tag className="size-4" aria-hidden="true" />
            <span>{textosActividades.adminRecursosTitulo}</span>
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
            <span>{textosActividades.nuevoInstructor}</span>
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
          <LoadingNotice label="Cargando instructores deportivos..." />
        </Card>
      )}

      {isError && (
        <Alert tone="error" title="No fue posible cargar los instructores">
          <div className="flex flex-col gap-3">
            <p className="text-xs">{getApiErrorMessage(errorObj)}</p>
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void instructoresQuery.refetch()}
              >
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
            <InstructoresFilters filters={filters} onChange={setFilters} />
          </Card>

          <InstructoresList
            instructores={filteredInstructores}
            onEdit={handleOpenEdit}
            onSuccess={handleSuccess}
          />
        </div>
      )}

      {/* Modal para Crear/Editar */}
      <InstructorFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        instructor={selectedInstructor}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
