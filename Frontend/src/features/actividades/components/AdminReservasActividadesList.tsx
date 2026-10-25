import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { ACTIVIDADES_ROUTES } from '../constants/routes';
import { textosActividades, formatearGTQ } from '../textos';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useRecursosActividadQuery } from '../hooks/useActividades';
import {
  useAdminReservasActividadQuery,
  useUpdateEstadoReservaActividadMutation,
} from '../hooks/useReservasActividad';
import {
  AdminReservasActividadesFilters,
  type ReservasActividadAdminFiltersState,
} from './AdminReservasActividadesFilters';
import type { ReservaActividad } from '../types';

export const AdminReservasActividadesList: React.FC = () => {
  const sedesQuery = useSedesQuery();
  const recursosQuery = useRecursosActividadQuery();
  const reservasQuery = useAdminReservasActividadQuery();

  const sedes = sedesQuery.data ?? [];
  const recursos = recursosQuery.data ?? [];
  const reservas = reservasQuery.data ?? [];

  const [filters, setFilters] = useState<ReservasActividadAdminFiltersState>({
    search: '',
    sucursalId: 'all',
    recursoId: 'all',
    fecha: '',
    estado: 'all',
  });

  // Modal para cambio de estado
  const [modalAction, setModalAction] = useState<{
    reserva: ReservaActividad;
    nuevoEstado: 'confirmada' | 'cancelada' | 'completada';
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const updateMutation = useUpdateEstadoReservaActividadMutation(modalAction?.reserva.id || 0);

  const sedesMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const sede of sedes) {
      map.set(sede.id, sede.nombre);
    }
    return map;
  }, [sedes]);

  const filtradas = useMemo(() => {
    return reservas.filter((item) => {
      // Búsqueda por ID, nombre o correo del cliente
      const searchLower = filters.search.trim().toLowerCase();
      const matchSearch =
        !searchLower ||
        String(item.id).includes(searchLower) ||
        item.Usuario?.nombre?.toLowerCase().includes(searchLower) ||
        item.Usuario?.email?.toLowerCase().includes(searchLower) ||
        item.RecursoActividad?.nombre?.toLowerCase().includes(searchLower);

      // Filtro por sede
      const matchSede =
        filters.sucursalId === 'all' ||
        item.RecursoActividad?.sucursal_id === filters.sucursalId;

      // Filtro por recurso
      const matchRecurso =
        filters.recursoId === 'all' || item.recurso_id === filters.recursoId;

      // Filtro por fecha
      const matchFecha = !filters.fecha || item.fecha === filters.fecha;

      // Filtro por estado
      const matchEstado =
        filters.estado === 'all' || item.estado === filters.estado;

      return matchSearch && matchSede && matchRecurso && matchFecha && matchEstado;
    });
  }, [reservas, filters]);

  const handleConfirmAction = async () => {
    if (!modalAction) return;
    setActionError(null);

    try {
      await updateMutation.mutateAsync({
        estado: modalAction.nuevoEstado,
      });
      setModalAction(null);
    } catch (err: any) {
      const code = err?.code || err?.response?.data?.code;
      const msg = err?.message || err?.response?.data?.message;

      if (code === 'RESERVATION_NOT_FINISHED') {
        setActionError(textosActividades.errorNoFinalizada);
      } else if (code === 'RESOURCE_OVERLAP') {
        setActionError(textosActividades.errorRecursoOcupado);
      } else if (code === 'INSTRUCTOR_OVERLAP') {
        setActionError(textosActividades.errorInstructorOcupado);
      } else if (code === 'INSTRUCTOR_INACTIVE') {
        setActionError(textosActividades.errorInstructorInactivo);
      } else if (code === 'ACTIVITY_DATE_IN_PAST') {
        setActionError(textosActividades.errorFechaPasada);
      } else {
        setActionError(msg || 'No fue posible actualizar el estado de la reserva.');
      }
    }
  };

  const estadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return 'border-verde-200 bg-verde-50 text-verde-800';
      case 'completada':
        return 'border-azul-200 bg-azul-50 text-azul-800';
      case 'cancelada':
        return 'border-neutro-300 bg-neutro-100 text-neutro-600';
      default:
        return 'border-neutro-200 bg-neutro-50 text-neutro-700';
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-1.5">
        <p className="eyebrow">{textosActividades.adminSubtitulo}</p>
        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-neutro-900">
          {textosActividades.adminTitulo}
        </h1>
        <p className="max-w-3xl text-sm text-neutro-600">
          {textosActividades.adminDescripcion}
        </p>
      </div>

      {/* Filtros */}
      <AdminReservasActividadesFilters
        filters={filters}
        onFilterChange={setFilters}
        sedes={sedes}
        recursos={recursos}
      />

      {/* Estado: Cargando */}
      {reservasQuery.isPending && (
        <div className="flex justify-center py-16">
          <LoadingNotice label={textosActividades.cargando} />
        </div>
      )}

      {/* Estado: Error */}
      {reservasQuery.isError && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            No fue posible cargar las reservas de actividades
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            Ocurrió un inconveniente al consultar el registro administrativo de actividades.
          </p>
          <Button type="button" variant="primary" onClick={() => reservasQuery.refetch()}>
            <RefreshCw className="size-4 mr-2" aria-hidden="true" />
            <span>{textosActividades.reintentar}</span>
          </Button>
        </Card>
      )}

      {/* Estado: Sin resultados */}
      {!reservasQuery.isPending && !reservasQuery.isError && filtradas.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Compass className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {textosActividades.sinReservasAdminTitulo}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md">
            {textosActividades.sinReservasAdminDesc}
          </p>
        </Card>
      )}

      {/* Listado / Tabla */}
      {!reservasQuery.isPending && !reservasQuery.isError && filtradas.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-neutro-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-neutro-700">
            <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold uppercase tracking-wider text-neutro-600">
              <tr>
                <th scope="col" className="px-4 py-3">ID</th>
                <th scope="col" className="px-4 py-3">Instalación</th>
                <th scope="col" className="px-4 py-3">Cliente</th>
                <th scope="col" className="px-4 py-3">Fecha y Horario</th>
                <th scope="col" className="px-4 py-3">Instructor / Equipo</th>
                <th scope="col" className="px-4 py-3">Total</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutro-100">
              {filtradas.map((reserva) => {
                const sedeNombre =
                  reserva.RecursoActividad?.Sucursal?.nombre ||
                  (reserva.RecursoActividad?.sucursal_id
                    ? sedesMap.get(reserva.RecursoActividad.sucursal_id)
                    : null) ||
                  textosActividades.noDisponible;

                const estado = reserva.estado || 'confirmada';

                return (
                  <tr key={reserva.id} className="hover:bg-neutro-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-neutro-900">
                      #{reserva.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutro-900">
                        {reserva.RecursoActividad?.nombre || `Recurso #${reserva.recurso_id}`}
                      </div>
                      <div className="text-xs text-neutro-500">
                        {sedeNombre} · {reserva.RecursoActividad?.tipo}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutro-900">
                        {reserva.Usuario?.nombre || `Usuario #${reserva.usuario_id}`}
                      </div>
                      {reserva.Usuario?.email && (
                        <div className="text-xs text-neutro-500">
                          {reserva.Usuario.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-neutro-800">
                        <Calendar className="size-3.5 text-neutro-400 shrink-0" />
                        <span>{reserva.fecha}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutro-500 mt-0.5">
                        <Clock className="size-3.5 text-neutro-400 shrink-0" />
                        <span>
                          {reserva.hora_inicio?.slice(0, 5)} - {reserva.hora_fin?.slice(0, 5)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>
                        {reserva.Instructor ? (
                          <span className="font-medium text-neutro-800">
                            {reserva.Instructor.nombre}
                          </span>
                        ) : (
                          <span className="text-neutro-400">{textosActividades.sinInstructor}</span>
                        )}
                      </div>
                      {reserva.con_equipo && (
                        <div className="text-bronce-700 font-medium mt-0.5">
                          ✓ Equipamiento
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-bronce-800">
                      {formatearGTQ(reserva.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${estadoBadgeClass(
                          estado
                        )}`}
                      >
                        {textosActividades.estados[estado as keyof typeof textosActividades.estados] || estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={ACTIVIDADES_ROUTES.ADMIN_DETALLE_RESERVA(reserva.id!)}
                          className={buttonStyles({
                            variant: 'ghost',
                            size: 'sm',
                            className: 'h-8 px-2 text-xs',
                          })}
                          title="Ver detalle"
                        >
                          <Eye className="size-3.5" aria-hidden="true" />
                          <span className="sr-only sm:not-sr-only sm:ml-1">Detalle</span>
                        </Link>

                        {/* Transiciones permitidas */}
                        {estado === 'confirmada' && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setModalAction({
                                  reserva,
                                  nuevoEstado: 'completada',
                                })
                              }
                              className="h-8 px-2 text-xs text-azul-700 hover:bg-azul-50"
                              title={textosActividades.completarActividad}
                            >
                              <CheckCircle2 className="size-3.5 text-azul-600" aria-hidden="true" />
                              <span className="sr-only sm:not-sr-only sm:ml-1">Completar</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setModalAction({
                                  reserva,
                                  nuevoEstado: 'cancelada',
                                })
                              }
                              className="h-8 px-2 text-xs text-rojo-700 hover:bg-rojo-50"
                              title={textosActividades.cancelarActividad}
                            >
                              <XCircle className="size-3.5 text-rojo-600" aria-hidden="true" />
                              <span className="sr-only sm:not-sr-only sm:ml-1">Cancelar</span>
                            </Button>
                          </>
                        )}

                        {(estado === 'cancelada' || estado === 'completada') && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setModalAction({
                                reserva,
                                nuevoEstado: 'confirmada',
                              })
                            }
                            className="h-8 px-2 text-xs text-verde-700 hover:bg-verde-50"
                            title={textosActividades.reactivarActividad}
                          >
                            <RefreshCw className="size-3.5 text-verde-600" aria-hidden="true" />
                            <span className="sr-only sm:not-sr-only sm:ml-1">Reactivar</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmación de cambio de estado */}
      {modalAction && (
        <Modal
          open={Boolean(modalAction)}
          onClose={() => {
            setModalAction(null);
            setActionError(null);
          }}
          title={textosActividades.confirmarCambioEstado}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutro-700">
              ¿Está seguro de cambiar el estado de la reserva recreativa{' '}
              <strong>#{modalAction.reserva.id}</strong> ({modalAction.reserva.RecursoActividad?.nombre}) al estado{' '}
              <strong className="uppercase text-bronce-700">{modalAction.nuevoEstado}</strong>?
            </p>

            {modalAction.nuevoEstado === 'completada' && (
              <p className="text-xs text-neutro-500 bg-neutro-50 p-2 rounded border border-neutro-200">
                {textosActividades.advertenciaCompletar}
              </p>
            )}

            {modalAction.nuevoEstado === 'confirmada' && (
              <p className="text-xs text-neutro-500 bg-neutro-50 p-2 rounded border border-neutro-200">
                {textosActividades.advertenciaReactivar}
              </p>
            )}

            {actionError && (
              <Alert tone="error">
                <p>{actionError}</p>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-neutro-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setModalAction(null);
                  setActionError(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant={modalAction.nuevoEstado === 'cancelada' ? 'danger' : 'primary'}
                onClick={handleConfirmAction}
                isLoading={updateMutation.isPending}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Actualizando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};
