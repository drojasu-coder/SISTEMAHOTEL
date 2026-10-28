import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminScope } from "@/features/admin-core/AdminScopeContext";
import { estadoReservaMesa } from "../estadoReservaMesa";
import { useTextosAdminRestaurante } from "../adminTextos";
import { useLocale } from "@/i18n/LocaleContext";
import { formatAdminCalendarDate, formatAdminTimeOfDay } from "@/features/admin-core/adminDates";
import {
  useAdminReservasMesaQuery,
  useUpdateEstadoReservaMesaMutation,
} from "../hooks/useReservasMesa";
import {
  AdminReservasRestauranteFilters,
  type AdminReservasRestauranteFiltersState,
} from "./AdminReservasRestauranteFilters";
import { RESTAURANTE_ROUTES } from "../constants/routes";
import type { ReservaMesa } from "../types";
import { ApiError } from "@/api/client/http";
import {
  UtensilsCrossed,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const AdminReservasRestauranteList: React.FC = () => {
  const { status, user } = useAuth();
  const t = useTextosAdminRestaurante();
  const { locale } = useLocale();

  const isAdmin = status === "authenticated" && (user?.rol === "admin" || user?.rol === "gerente_habitaciones");
  // La sede del selector global del panel se aplica en el servidor.
  const { selectedSedeId } = useAdminScope();
  const { data: reservas = [], isLoading, isError, refetch } = useAdminReservasMesaQuery(
    user?.id,
    isAdmin,
    selectedSedeId
  );

  const updateMutation = useUpdateEstadoReservaMesaMutation();

  const [filters, setFilters] = useState<AdminReservasRestauranteFiltersState>({
    busqueda: "",
    estado: "",
    fecha: "",
  });

  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [modalAction, setModalAction] = useState<{
    reserva: ReservaMesa;
    nuevoEstado: "confirmada" | "cancelada";
  } | null>(null);

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((r) => {
      if (filters.estado !== "" && r.estado !== filters.estado) {
        return false;
      }

      if (filters.fecha !== "" && r.fecha !== filters.fecha) {
        return false;
      }

      if (filters.busqueda.trim() !== "") {
        const query = filters.busqueda.trim().toLowerCase();
        const idMatch = String(r.id).includes(query);
        const clienteNombre = r.Usuario?.nombre?.toLowerCase() || "";
        const clienteEmail = r.Usuario?.email?.toLowerCase() || "";
        const nombreMatch = clienteNombre.includes(query);
        const emailMatch = clienteEmail.includes(query);
        if (!idMatch && !nombreMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [reservas, filters]);

  const handleOpenActionModal = (
    reserva: ReservaMesa,
    nuevoEstado: "confirmada" | "cancelada"
  ) => {
    setFeedback(null);
    setModalAction({ reserva, nuevoEstado });
  };

  const handleConfirmAction = async () => {
    if (!modalAction) return;

    try {
      await updateMutation.mutateAsync({
        id: modalAction.reserva.id,
        data: { estado: modalAction.nuevoEstado },
      });

      setFeedback({
        tone: "success",
        message: t.estadoActualizadoExito,
      });
      setModalAction(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === "TABLE_UNAVAILABLE" || err.code === "TABLE_IN_MAINTENANCE") {
          setFeedback({
            tone: "error",
            message: t.errorConflictoReactivacion,
          });
        } else {
          setFeedback({
            tone: "error",
            message: err.message || t.errorActualizarEstado,
          });
        }
      } else {
        setFeedback({
          tone: "error",
          message: t.errorActualizarEstado,
        });
      }
      setModalAction(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{t.subtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold text-neutro-900">
            {t.titulo}
          </h1>
          <p className="text-sm text-neutro-600 max-w-2xl">{t.descripcion}</p>
        </div>

        <div className="flex gap-3 self-start sm:self-center">
          <Link
            to="/admin/restaurante"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutro-300 bg-white px-4 py-2 text-sm font-medium text-neutro-700 shadow-sm hover:bg-neutro-50 transition-colors"
          >
            <UtensilsCrossed className="size-4" aria-hidden="true" />
            <span>{t.irGestionMesas}</span>
          </Link>
        </div>
      </div>

      {/* Feedback Mensajes */}
      {feedback && (
        <Alert tone={feedback.tone}>
          <div className="flex items-center justify-between gap-4">
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              {t.cerrarBoton}
            </button>
          </div>
        </Alert>
      )}

      {/* Filtros */}
      <AdminReservasRestauranteFilters
        filters={filters}
        onChange={setFilters}
        onReset={() =>
          setFilters({ busqueda: "", estado: "", fecha: "" })
        }
        totalCount={reservas.length}
        filteredCount={reservasFiltradas.length}
      />

      {/* Estado: Cargando */}
      {isLoading && (
        <Card className="p-8 space-y-4" aria-busy="true">
          <div className="h-8 w-1/4 animate-pulse rounded bg-neutro-200" />
          <div className="h-10 w-full animate-pulse rounded bg-neutro-200" />
          <div className="h-10 w-full animate-pulse rounded bg-neutro-200" />
          <div className="h-10 w-full animate-pulse rounded bg-neutro-200" />
        </Card>
      )}

      {/* Estado: Error */}
      {isError && !isLoading && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">{t.errorCargar}</h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            Ocurrió un problema al obtener las reservas de restaurante.
          </p>
          <Button type="button" variant="primary" onClick={() => refetch()}>
            {t.reintentar}
          </Button>
        </Card>
      )}

      {/* Estado: Sin Reservas en el Hotel */}
      {!isLoading && !isError && reservas.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <UtensilsCrossed className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {t.sinReservasTitulo}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md">
            {t.sinReservasDesc}
          </p>
        </Card>
      )}

      {/* Estado: Sin Resultados por Filtros */}
      {!isLoading && !isError && reservas.length > 0 && reservasFiltradas.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {t.sinResultados}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            Intente modificando los filtros de sede, fecha, estado o el término de búsqueda.
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setFilters({ busqueda: "", estado: "", fecha: "" })
            }
          >
            Limpiar filtros
          </Button>
        </Card>
      )}

      {/* Tabla de Reservas */}
      {!isLoading && !isError && reservasFiltradas.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-neutro-200 bg-white shadow-sm">
          <table className="w-full min-w-[60rem] text-left text-sm text-neutro-800">
            <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold uppercase tracking-wider text-neutro-600">
              <tr>
                <th className="px-3 py-3">{t.colId}</th>
                <th className="px-3 py-3">{t.colCliente}</th>
                <th className="px-3 py-3">{t.colSede}</th>
                <th className="px-3 py-3">{t.colMesa}</th>
                <th className="px-3 py-3">{t.colFecha}</th>
                <th className="px-3 py-3">{t.colHorario}</th>
                <th className="px-3 py-3">{t.colComensales}</th>
                <th className="px-3 py-3">{t.colEstado}</th>
                <th className="px-3 py-3 text-right">{t.colAcciones}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutro-200">
              {reservasFiltradas.map((r) => {
                const isCancelada = r.estado === "cancelada";
                const estado = estadoReservaMesa(r.estado, t.estados);
                const sedeNombre =
                  r.Mesa?.Sucursal?.nombre || t.sedeId(r.Mesa?.sucursal_id ?? "");

                return (
                  <tr key={r.id} className="hover:bg-neutro-50 transition-colors">
                    <td className="px-3 py-3 font-semibold text-neutro-900">
                      #{r.id}
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-medium text-neutro-900">
                          {r.Usuario?.nombre || t.clienteSinNombre}
                        </p>
                        <p className="text-xs text-neutro-500">
                          {r.Usuario?.email || t.usuarioId(r.usuario_id)}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-neutro-700">{sedeNombre}</td>
                    <td className="px-3 py-3">
                      <div>
                        <span className="whitespace-nowrap font-medium">{t.mesa(r.mesa_id)}</span>
                        {r.Mesa?.zona && (
                          <span className="text-xs text-neutro-500 block">
                            {r.Mesa.zona}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-neutro-700">{formatAdminCalendarDate(r.fecha, locale)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-neutro-700">{formatAdminTimeOfDay(r.hora, locale)}</td>
                    <td className="px-3 py-3 text-neutro-700">
                      {t.personas(r.numero_comensales)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estado.className}`}
                        title={estado.conocido ? undefined : t.estadoRegistrado(r.estado)}
                      >
                        {estado.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                      <Link
                        to={RESTAURANTE_ROUTES.ADMIN_DETALLE_RESERVA(r.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-bronce-700 hover:text-bronce-900"
                      >
                        <span>{t.verDetalle}</span>
                        <ArrowRight className="size-3" aria-hidden="true" />
                      </Link>

                      {isCancelada ? (
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={t.reactivarAria(r.id)}
                          className="shrink-0 whitespace-nowrap text-xs text-verde-700 hover:text-verde-800"
                          onClick={() => handleOpenActionModal(r, "confirmada")}
                        >
                          <CheckCircle2 className="size-3.5 mr-1" aria-hidden="true" />
                          {t.reactivarReserva}
                        </Button>
                      ) : r.estado === "confirmada" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={t.cancelarAria(r.id)}
                          className="shrink-0 whitespace-nowrap text-xs text-error-600 hover:text-error-700"
                          onClick={() => handleOpenActionModal(r, "cancelada")}
                        >
                          <XCircle className="size-3.5 mr-1" aria-hidden="true" />
                          {t.cancelarReserva}
                        </Button>
                      ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Confirmación de Cambio de Estado */}
      <Modal
        open={!!modalAction}
        onClose={() => setModalAction(null)}
        title={
          modalAction?.nuevoEstado === "cancelada"
            ? t.confirmarCancelarTitulo
            : t.confirmarReactivarTitulo
        }
        description={
          modalAction?.nuevoEstado === "cancelada"
            ? t.confirmarCancelarDesc
            : t.confirmarReactivarDesc
        }
      >
        <div className="space-y-4 pt-2">
          {modalAction && (
            <div className="rounded-md bg-neutro-50 p-4 border border-neutro-200 text-sm space-y-1">
              <p>
                <span className="font-semibold">{t.colId}:</span> #{modalAction.reserva.id}
              </p>
              <p>
                <span className="font-semibold">{t.colCliente}:</span>{" "}
                {modalAction.reserva.Usuario?.nombre} ({modalAction.reserva.Usuario?.email})
              </p>
              <p>
                <span className="font-semibold">{t.colMesa}:</span> {t.mesa(modalAction.reserva.mesa_id)}
              </p>
              <p>
                <span className="font-semibold">{t.fechaYHorario}:</span>{" "}
                {t.fechaHora(formatAdminCalendarDate(modalAction.reserva.fecha, locale), formatAdminTimeOfDay(modalAction.reserva.hora, locale))}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-neutro-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalAction(null)}
              disabled={updateMutation.isPending}
            >
              {t.cerrarBoton}
            </Button>
            <Button
              type="button"
              variant={modalAction?.nuevoEstado === "cancelada" ? "danger" : "primary"}
              onClick={handleConfirmAction}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? t.procesando : t.confirmarBoton}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
