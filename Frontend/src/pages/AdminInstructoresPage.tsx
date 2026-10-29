import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Card } from '@/components/ui/Card';
import { useInstructoresQuery } from '@/features/actividades/hooks/useActividades';
import {
  InstructoresFilters,
  type InstructoresFiltersState,
} from '@/features/actividades/components/InstructoresFilters';
import { InstructoresList } from '@/features/actividades/components/InstructoresList';
import { InstructorFormModal } from '@/features/actividades/components/InstructorFormModal';
import { textosActividades } from '@/features/actividades/textos';
import type { Instructor } from '@/features/actividades/types';
import { getApiErrorMessage } from '@/api/errors';
import { ActividadesAdminNav } from '@/features/actividades/components/ActividadesAdminNav';
import { useTextosGestionActividades } from '@/features/actividades/gestionTextos';

export const AdminInstructoresPage: React.FC = () => {
  const t = useTextosGestionActividades();
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
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutro-500">{t.modulo}</p>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.instructoresTitulo}</h1>
          {instructoresQuery.isSuccess && <p className="mt-1 text-sm text-neutro-600">{t.instructoresResumen(instructores.length, instructores.filter((item) => item.activo).length)}</p>}
        </div>
        <Button type="button" onClick={handleOpenCreate}><Plus className="size-4" aria-hidden="true" />{t.nuevoInstructor}</Button>
      </header>
      <ActividadesAdminNav />
      <p className="text-xs text-neutro-500">{t.instructoresNota}</p>
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
        <div className="flex flex-col gap-4">
          {instructores.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.vacioI}</p> : <>
          <InstructoresFilters filters={filters} onChange={setFilters} />
          <InstructoresList
            instructores={filteredInstructores}
            onEdit={handleOpenEdit}
            onSuccess={handleSuccess}
          />
          </>}
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
