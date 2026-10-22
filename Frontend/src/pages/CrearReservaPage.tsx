import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useTiposHabitacionQuery } from '@/features/tipos-habitacion/hooks/useTiposHabitacion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { getApiErrorMessage } from '@/api/errors';
import { ApiError } from '@/api/client/http';

import {
  textosCrearReserva,
  useDisponibilidadQuery,
  useCreateReservaMutation,
  CriteriosBusquedaForm,
  HabitacionesDisponiblesList,
  ResumenReservaModal,
  ReservaConfirmadaCard,
  type DisponibilidadHabitacionQuery,
  type HabitacionDisponible,
  type ReservaHabitacion,
  type CreateReservaHabitacionInput,
} from '@/features/crear-reserva';

export const CrearReservaPage: React.FC = () => {
  const { user, status } = useAuth();

  // 1. Estado de autenticación y permisos exclusivos para rol cliente
  const isAuthLoading = status === 'loading';
  const isCliente = status === 'authenticated' && user?.rol === 'cliente';

  // 2. Catálogos auxiliares (solo cuando la sesión esté disponible)
  const sedesQuery = useSedesQuery();
  const tiposQuery = useTiposHabitacionQuery();

  const sedes = useMemo(() => sedesQuery.data ?? [], [sedesQuery.data]);
  const tipos = useMemo(() => tiposQuery.data ?? [], [tiposQuery.data]);

  // 3. Estado de búsqueda y selección
  const [submittedQuery, setSubmittedQuery] =
    useState<DisponibilidadHabitacionQuery | null>(null);
  const [criteriaChanged, setCriteriaChanged] = useState<boolean>(false);
  const [selectedHabitacion, setSelectedHabitacion] =
    useState<HabitacionDisponible | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [createdReserva, setCreatedReserva] =
    useState<ReservaHabitacion | null>(null);

  // 4. Consulta de disponibilidad y mutación de creación
  const disponibilidadQuery = useDisponibilidadQuery(
    submittedQuery,
    isCliente && !criteriaChanged
  );
  const createMutation = useCreateReservaMutation();

  // Invalida la selección actual al modificar cualquier campo del formulario
  const handleCriteriaChange = useCallback(() => {
    setCriteriaChanged(true);
    setSelectedHabitacion(null);
  }, []);

  // Envío del formulario de búsqueda
  const handleSearch = useCallback((query: DisponibilidadHabitacionQuery) => {
    setSubmittedQuery(query);
    setCriteriaChanged(false);
    setSelectedHabitacion(null);
    createMutation.reset();
  }, [createMutation]);

  // Selección de una habitación para abrir el resumen
  const handleSelectHabitacion = useCallback((habitacion: HabitacionDisponible) => {
    setSelectedHabitacion(habitacion);
    setModalOpen(true);
  }, []);

  // Actualización de disponibilidad tras un conflicto 409
  const handleActualizarDisponibilidad = useCallback(() => {
    setSelectedHabitacion(null);
    setModalOpen(false);
    createMutation.reset();
    if (submittedQuery) {
      void disponibilidadQuery.refetch();
    }
  }, [createMutation, submittedQuery, disponibilidadQuery]);

  // Confirmar y crear la reserva con el payload exacto
  const handleConfirmReserva = async () => {
    if (!selectedHabitacion || !submittedQuery) return;

    const payload: CreateReservaHabitacionInput = {
      habitacion_id: selectedHabitacion.id,
      fecha_entrada: submittedQuery.fecha_entrada,
      fecha_salida: submittedQuery.fecha_salida,
      numero_huespedes: submittedQuery.numero_huespedes,
    };

    try {
      const nuevaReserva = await createMutation.mutateAsync(payload);
      setCreatedReserva(nuevaReserva);
      setModalOpen(false);
      setSelectedHabitacion(null);
    } catch (err: unknown) {
      // Los errores (409, 400, 422, red) se reflejan en createMutation.error y se muestran en el modal
      if (err instanceof ApiError && err.status === 409) {
        // En caso de conflicto, se conserva el submittedQuery para poder actualizar disponibilidad
        void disponibilidadQuery.refetch();
      }
    }
  };

  const handleReset = useCallback(() => {
    setCreatedReserva(null);
    setSelectedHabitacion(null);
    setSubmittedQuery(null);
    setCriteriaChanged(false);
    createMutation.reset();
  }, [createMutation]);

  // Bloqueo de renderizado durante la carga de autenticación
  if (isAuthLoading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-16">
        <LoadingNotice label="Verificando sesión..." />
      </div>
    );
  }

  // Restricción de acceso para roles no clientes o no autenticados
  if (!isCliente) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-advertencia-100 text-advertencia-700">
            <ShieldAlert className="size-8" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-neutro-900">
            {textosCrearReserva.accesoRestringidoTitulo}
          </h1>
          <p className="text-sm text-neutro-600">
            {textosCrearReserva.accesoRestringidoMensaje}
          </p>
          {!user && (
            <Link
              to="/login"
              className="mt-2 inline-flex min-h-11 items-center justify-center rounded-md bg-selva-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-selva-700"
            >
              {textosCrearReserva.botonIniciarSesion}
            </Link>
          )}
        </Card>
      </div>
    );
  }

  const sedeSeleccionada = sedes.find(
    (s) => s.id === submittedQuery?.sucursal_id
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Encabezado */}
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-bold text-neutro-900">
          {textosCrearReserva.tituloPagina}
        </h1>
        <p className="text-sm text-neutro-600">
          {textosCrearReserva.subtituloPagina}
        </p>
      </header>

      {/* Manejo de fallos en catálogos auxiliares */}
      {sedesQuery.isError && (
        <Alert tone="error">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{textosCrearReserva.errorCatSedes}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => sedesQuery.refetch()}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              {textosCrearReserva.botonReintentar}
            </Button>
          </div>
        </Alert>
      )}

      {tiposQuery.isError && (
        <Alert tone="warning">
          <div className="flex items-center justify-between">
            <span>{textosCrearReserva.errorCatTipos}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => tiposQuery.refetch()}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              {textosCrearReserva.botonReintentar}
            </Button>
          </div>
        </Alert>
      )}

      {/* Si ya se creó la reserva con éxito, mostrar la tarjeta de confirmación */}
      {createdReserva ? (
        <ReservaConfirmadaCard
          reserva={createdReserva}
          onReset={handleReset}
        />
      ) : (
        <>
          {/* Formulario de búsqueda de disponibilidad */}
          <CriteriosBusquedaForm
            sedes={sedes}
            tiposHabitacion={tipos}
            isSearching={disponibilidadQuery.isFetching}
            onSubmitSearch={handleSearch}
            onCriteriaChange={handleCriteriaChange}
            initialValues={
              submittedQuery
                ? {
                    sucursal_id: String(submittedQuery.sucursal_id),
                    fecha_entrada: submittedQuery.fecha_entrada,
                    fecha_salida: submittedQuery.fecha_salida,
                    numero_huespedes: String(submittedQuery.numero_huespedes),
                    tipo_habitacion_id:
                      submittedQuery.tipo_habitacion_id !== undefined
                        ? String(submittedQuery.tipo_habitacion_id)
                        : '',
                  }
                : undefined
            }
          />

          {/* Error en la consulta de disponibilidad */}
          {disponibilidadQuery.isError && (
            <Alert tone="error">
              <div className="flex items-center justify-between">
                <span>{getApiErrorMessage(disponibilidadQuery.error)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => disponibilidadQuery.refetch()}
                >
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                  {textosCrearReserva.botonReintentar}
                </Button>
              </div>
            </Alert>
          )}

          {/* Listado de resultados de habitaciones disponibles */}
          {submittedQuery && !disponibilidadQuery.isError && (
            <HabitacionesDisponiblesList
              habitaciones={disponibilidadQuery.data ?? []}
              isLoading={disponibilidadQuery.isLoading}
              criteriaChanged={criteriaChanged}
              selectedHabitacionId={selectedHabitacion?.id}
              onSelectHabitacion={handleSelectHabitacion}
            />
          )}

          {/* Modal de resumen y confirmación */}
          <ResumenReservaModal
            open={modalOpen}
            onClose={() => {
              if (!createMutation.isPending) {
                setModalOpen(false);
              }
            }}
            habitacion={selectedHabitacion}
            criterios={submittedQuery}
            sedeNombre={sedeSeleccionada?.nombre}
            isSubmitting={createMutation.isPending}
            error={createMutation.error}
            onConfirm={handleConfirmReserva}
            onActualizarDisponibilidad={handleActualizarDisponibilidad}
          />
        </>
      )}
    </div>
  );
};
