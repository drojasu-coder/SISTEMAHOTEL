import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useTiposHabitacionQuery } from '@/features/tipos-habitacion/hooks/useTiposHabitacion';
import { hasSiteTypes, typesForSite } from '@/features/habitaciones/public/roomCategories';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { TranslatedError } from '@/i18n/public';
import { ApiError } from '@/api/client/http';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { CatalogSiteNotice } from '@/features/preferencias/SiteContextNotice';
import { habitacionesApi } from '@/features/habitaciones/api/habitacionesApi';

import { useDisponibilidadQuery, useCreateReservaMutation, CriteriosBusquedaForm, HabitacionesDisponiblesList, ResumenReservaModal, ReservaConfirmadaCard, type DisponibilidadHabitacionQuery, type ReservaHabitacion, type CreateReservaHabitacionInput } from '@/features/crear-reserva';
import type { HabitacionDisponiblePublico, TipoHabitacion } from '@/features/habitaciones/types';
import { busquedaReservaFormSchema, toDisponibilidadQuery } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { calendarNights } from '@/lib/dates';
import { LegalNotice } from '@/features/legal';

const SELECTION_DRAFT_KEY = 'hunahpu.crear-reserva-selection.v1';

function saveSelectionDraft(habitacion: HabitacionDisponiblePublico | null) {
  try {
    if (habitacion) {
      sessionStorage.setItem(SELECTION_DRAFT_KEY, JSON.stringify({ version: 1, habitacion }));
    } else {
      sessionStorage.removeItem(SELECTION_DRAFT_KEY);
    }
  } catch { /* sessionStorage puede no estar disponible */ }
}

function restoreSelectionDraft(): HabitacionDisponiblePublico | null {
  try {
    const raw = sessionStorage.getItem(SELECTION_DRAFT_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw);
    if (!record || record.version !== 1 || !record.habitacion) return null;
    return record.habitacion as HabitacionDisponiblePublico;
  } catch { return null; }
}

export const CrearReservaPage: React.FC = () => {
  const creationLock = useRef(false);
  const textosCrearReserva = usePublicTexts('crearReserva');
  const { p, date } = usePublicInterface();
  const resultsRef = useRef<HTMLDivElement>(null);
  const criteriaRef = useRef<HTMLDivElement>(null);
  const { user, status } = useAuth();
  const scope = usePublicPreferences();
  const navigate = useNavigate();

  // 1. Estado de autenticación y permisos exclusivos para rol cliente
  const isAuthLoading = status === 'loading';
  const isCliente = status === 'authenticated' && user?.rol === 'cliente';

  // 2. Catálogos auxiliares. Las sedes son públicas; los tipos son públicos o privados según la sesión.
  const sedesQuery = useSedesQuery();
  const tiposPrivadosQuery = useTiposHabitacionQuery(isCliente);
  const tiposPublicosQuery = useQuery<TipoHabitacion[], Error>({
    queryKey: ['tipos-habitacion-public'],
    queryFn: () => habitacionesApi.getPublicTiposHabitacion(),
    enabled: !isAuthLoading && !isCliente,
    staleTime: 1000 * 60 * 45,
  });
  const tiposQuery = isCliente ? tiposPrivadosQuery : tiposPublicosQuery;

  const sedes = useMemo(() => scope.managed ? scope.sites : sedesQuery.data ?? [], [scope.managed, scope.sites, sedesQuery.data]);
  // Solo las categorías de la sede elegida, por su sucursal_id y con nombre comercial.
  // Fuera del sitio público gestionado se conservan todos los tipos que entrega el servidor.
  const tiposTodos = Array.isArray(tiposQuery.data) ? tiposQuery.data : [];
  const tipos = scope.managed && hasSiteTypes(tiposTodos) ? typesForSite(tiposTodos, scope.selected) : tiposTodos;

  // 3. Estado de búsqueda y selección
  const [submittedQuery, setSubmittedQuery] =
    useState<DisponibilidadHabitacionQuery | null>(null);
  const [criteriaChanged, setCriteriaChanged] = useState<boolean>(false);
  const [selectedHabitacion, setSelectedHabitacion] =
    useState<HabitacionDisponiblePublico | null>(() => restoreSelectionDraft());
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [createdReserva, setCreatedReserva] =
    useState<ReservaHabitacion | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedRoom = useRef(Number(searchParams.get('habitacion_id')) || null);
  const [requestedRoomUnavailable, setRequestedRoomUnavailable] = useState(false);
  const [paramQueryApplied, setParamQueryApplied] = useState(false);

  const incompatibleSite = scope.managed && submittedQuery !== null &&
    (scope.selected !== submittedQuery.sucursal_id || scope.status !== 'ready');
  useEffect(() => {
    if (incompatibleSite) setCriteriaChanged(true);
  }, [incompatibleSite]);

  useEffect(() => {
    if (paramQueryApplied) return;
    const sucursalIdParam = searchParams.get('sucursal_id');
    const fechaEntradaParam = searchParams.get('fecha_entrada');
    const fechaSalidaParam = searchParams.get('fecha_salida');
    const huespedesParam = searchParams.get('numero_huespedes');
    const tipoParam = searchParams.get('tipo_habitacion_id');

    if (sucursalIdParam) {
      if (scope.managed && scope.status !== 'ready') return;
      if (scope.managed && !scope.sites.some((s) => s.id === Number(sucursalIdParam))) return;
      if (scope.managed) scope.choose(Number(sucursalIdParam));
      if (fechaEntradaParam && fechaSalidaParam && huespedesParam) {
        const validated = busquedaReservaFormSchema.safeParse({
          sucursal_id: sucursalIdParam,
          fecha_entrada: fechaEntradaParam,
          fecha_salida: fechaSalidaParam,
          numero_huespedes: huespedesParam,
          tipo_habitacion_id: tipoParam ?? '',
        });
        if (validated.success) {
          setSubmittedQuery(toDisponibilidadQuery(validated.data));
          const restored = restoreSelectionDraft();
          if (restored) setSelectedHabitacion(restored);
        }
      }
      setParamQueryApplied(true);
    }
  }, [searchParams, paramQueryApplied, scope]);

  // 4. Consulta de disponibilidad y mutación de creación
  const disponibilidadQuery = useDisponibilidadQuery(
    submittedQuery,
    !isAuthLoading && !criteriaChanged && !incompatibleSite
  );
  const createMutation = useCreateReservaMutation();

  // El ID del enlace expresa intención; solo una respuesta vigente permite seleccionarlo.
  useEffect(() => {
    if (!requestedRoom.current || !disponibilidadQuery.isSuccess || disponibilidadQuery.isFetching || criteriaChanged || incompatibleSite) return;
    // Si esa unidad ya no está libre, se ofrece otra unidad disponible de la misma categoría.
    const match = disponibilidadQuery.data.find((room) => room.id === requestedRoom.current)
      ?? (submittedQuery?.tipo_habitacion_id !== undefined
        ? disponibilidadQuery.data.find((room) => room.tipo?.id === submittedQuery.tipo_habitacion_id)
        : undefined)
      ?? null;
    setSelectedHabitacion(match);
    saveSelectionDraft(match);
    setRequestedRoomUnavailable(!match);
    requestedRoom.current = null;
  }, [disponibilidadQuery.data, disponibilidadQuery.isSuccess, disponibilidadQuery.isFetching, criteriaChanged, incompatibleSite, submittedQuery]);

  // Invalida la selección actual al modificar cualquier campo del formulario
  const handleCriteriaChange = useCallback(() => {
    setCriteriaChanged(true);
    setSelectedHabitacion(null);
    setRequestedRoomUnavailable(false);
  }, []);

  // Envío del formulario de búsqueda
  const handleSearch = useCallback((query: DisponibilidadHabitacionQuery) => {
    setSubmittedQuery(query);
    setCriteriaChanged(false);
    setSelectedHabitacion(null);
    saveSelectionDraft(null);
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) next.set(key, String(value));
    const roomId = searchParams.get('habitacion_id');
    if (roomId && /^[1-9]\d*$/.test(roomId)) {
      next.set('habitacion_id', roomId);
      requestedRoom.current = Number(roomId);
    }
    setSearchParams(next, { replace: true });
    createMutation.reset();
  }, [createMutation, searchParams, setSearchParams]);

  // Selección de una habitación para abrir el resumen
  const handleSelectHabitacion = useCallback((habitacion: HabitacionDisponiblePublico) => {
    setSelectedHabitacion(habitacion);
    saveSelectionDraft(habitacion);
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

  // Confirmar y crear la reserva con el payload exacto.
  // La creación requiere sesión de cliente: si no hay, se preserva el contexto y se redirige al login.
  const handleConfirmReserva = async () => {
    if (!selectedHabitacion || !submittedQuery || incompatibleSite || criteriaChanged || creationLock.current || createMutation.isPending) return;
    if (createMutation.error && (!(createMutation.error instanceof ApiError) || createMutation.error.status === 0 || createMutation.error.status >= 500)) return;

    if (!isCliente) {
      const search = new URLSearchParams();
      search.set('sucursal_id', String(submittedQuery.sucursal_id));
      search.set('fecha_entrada', submittedQuery.fecha_entrada);
      search.set('fecha_salida', submittedQuery.fecha_salida);
      search.set('numero_huespedes', String(submittedQuery.numero_huespedes));
      search.set('habitacion_id', String(selectedHabitacion.id));
      if (submittedQuery.tipo_habitacion_id !== undefined) {
        search.set('tipo_habitacion_id', String(submittedQuery.tipo_habitacion_id));
      }
      const fromUrl = `/reservar?${search.toString()}`;
      navigate('/login', { state: { from: fromUrl } });
      return;
    }

    creationLock.current = true;

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
      saveSelectionDraft(null);
    } catch (err: unknown) {
      // Los errores (409, 400, 422, red) se reflejan en createMutation.error y se muestran en el modal
      if (err instanceof ApiError && err.status === 409) {
        // En caso de conflicto, se conserva el submittedQuery para poder actualizar disponibilidad
        void disponibilidadQuery.refetch();
      }
    } finally {
      creationLock.current = false;
    }
  };

  const handleReset = useCallback(() => {
    setCreatedReserva(null);
    setSelectedHabitacion(null);
    setSubmittedQuery(null);
    setCriteriaChanged(false);
    saveSelectionDraft(null);
    createMutation.reset();
  }, [createMutation]);

  // Bloqueo de renderizado durante la carga de autenticación
  if (isAuthLoading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-16">
        <LoadingNotice label={p('sessionChecking')} />
      </div>
    );
  }

  const sedeSeleccionada = sedes.find(
    (s) => s.id === submittedQuery?.sucursal_id
  );

  return (
    <PageContainer>
      <PageHeader title={textosCrearReserva.tituloPagina} description={textosCrearReserva.subtituloPagina} />

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
          <div ref={criteriaRef}>
          <CriteriosBusquedaForm
            publicSite={scope.managed ? scope.selected : undefined}
            onSiteChange={scope.choose}
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
                : searchParams.size > 0
                ? {
                    sucursal_id: searchParams.get('sucursal_id') || '',
                    fecha_entrada: searchParams.has('fecha_entrada') ? searchParams.get('fecha_entrada')! : undefined,
                    fecha_salida: searchParams.has('fecha_salida') ? searchParams.get('fecha_salida')! : undefined,
                    numero_huespedes: searchParams.has('numero_huespedes') ? searchParams.get('numero_huespedes')! : undefined,
                    tipo_habitacion_id: searchParams.get('tipo_habitacion_id') || '',
                  }
                : undefined
            }
          />
          </div>
          <LegalNotice />
          {submittedQuery && disponibilidadQuery.isSuccess && !disponibilidadQuery.isFetching && !criteriaChanged && !incompatibleSite && (
            <Button variant="text" onClick={() => {
              resultsRef.current?.focus({ preventScroll: true });
              resultsRef.current?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
            }}>{p('stayViewResults')}</Button>
          )}

          <CatalogSiteNotice />

          {requestedRoomUnavailable && <Alert tone="info">{p('roomNotAvailable')}</Alert>}

          {/* Error en la consulta de disponibilidad */}
          {disponibilidadQuery.isError && (
            <Alert tone="error">
              <div className="flex items-center justify-between">
                <span><TranslatedError error={{ api: disponibilidadQuery.error }} /></span>
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
            <div ref={resultsRef} tabIndex={-1} role="region" aria-label={textosCrearReserva.seccionResultados} aria-describedby="availability-criteria" className="scroll-mt-28 space-y-4 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-bronce-600">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-bronce-200 bg-bronce-50 p-4">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-bronce-700">{p('stayResultsFor')}</p>
                  <p id="availability-criteria" className="mt-1 text-sm text-neutro-800"><span lang="es">{sedeSeleccionada?.nombre}</span> · {date(submittedQuery.fecha_entrada)} — {date(submittedQuery.fecha_salida)} · {submittedQuery.numero_huespedes} {p(submittedQuery.numero_huespedes === 1 ? 'guest' : 'guests')} · {textosCrearReserva.nochesCalculadas(calendarNights(submittedQuery.fecha_entrada, submittedQuery.fecha_salida) ?? 0)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => criteriaRef.current?.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')?.focus()}>{p('stayEditCriteria')}</Button>
              </div>
            <HabitacionesDisponiblesList
              habitaciones={disponibilidadQuery.data ?? []}
              isLoading={disponibilidadQuery.isLoading}
              criteriaChanged={criteriaChanged || incompatibleSite}
              selectedHabitacionId={selectedHabitacion?.id}
              onSelectHabitacion={handleSelectHabitacion}
            />
            </div>
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
            invalidated={incompatibleSite || criteriaChanged}
            error={createMutation.error}
            onConfirm={handleConfirmReserva}
            onActualizarDisponibilidad={handleActualizarDisponibilidad}
          />
        </>
      )}
    </PageContainer>
  );
};
