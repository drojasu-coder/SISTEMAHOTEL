import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/AuthContext";
import {
  useAdminReservaMesaDetalleQuery,
  useUpdateEstadoReservaMesaMutation,
} from "../hooks/useReservasMesa";
import { textosRestaurante } from "../textos";
import { RESTAURANTE_ROUTES } from "../constants/routes";
import { ApiError } from "@/api/client/http";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  UtensilsCrossed,
  User,
  Mail,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const AdminDetalleReservaRestaurante: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = id ? parseInt(id, 10) : NaN;
  const { status, user } = useAuth();
  const t = textosRestaurante.adminReservas;

  const isAdmin = status === "authenticated" && user?.rol === "admin";
  const reservaQuery = useAdminReservaMesaDetalleQuery(numericId, user?.id, isAdmin);
  const reserva = reservaQuery.data;

  const updateMutation = useUpdateEstadoReservaMesaMutation();

  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [nuevoEstadoObjetivo, setNuevoEstadoObjetivo] = useState<
    "confirmada" | "cancelada"
  >("cancelada");

  if (isNaN(numericId) || numericId <= 0) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h1 className="text-xl font-bold text-neutro-900 mb-2">Identificador inválido</h1>
          <p className="text-sm text-neutro-600 mb-6">
            El identificador proporcionado para la reserva administrativa no es válido.
          </p>
          <Link
            to={RESTAURANTE_ROUTES.ADMIN_RESERVAS}
            className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t.volverAlListado}</span>
          </Link>
        </Card>
      </section>
    );
  }

  const handleOpenAction = (nuevoEstado: "confirmada" | "cancelada") => {
    setFeedback(null);
    setNuevoEstadoObjetivo(nuevoEstado);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmChange = async () => {
    try {
      await updateMutation.mutateAsync({
        id: numericId,
        data: { estado: nuevoEstadoObjetivo },
      });

      setFeedback({
        tone: "success",
        message: t.estadoActualizadoExito,
      });
      setIsConfirmModalOpen(false);
      reservaQuery.refetch();
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
      setIsConfirmModalOpen(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      {/* Botón Volver */}
      <div>
        <Link
          to={RESTAURANTE_ROUTES.ADMIN_RESERVAS}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutro-600 hover:text-neutro-900 transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t.volverAlListado}</span>
        </Link>
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

      {/* Estado: Cargando */}
      {reservaQuery.isLoading && (
        <Card className="p-8 space-y-6" aria-busy="true">
          <div className="h-8 w-1/3 animate-pulse rounded bg-neutro-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-neutro-200" />
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="h-20 w-full animate-pulse rounded bg-neutro-200" />
            <div className="h-20 w-full animate-pulse rounded bg-neutro-200" />
          </div>
        </Card>
      )}

      {/* Estado: Error o No encontrada */}
      {(reservaQuery.isError || (!reservaQuery.isLoading && !reserva)) && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h1 className="text-xl font-bold text-neutro-900 mb-2">{t.errorCargar}</h1>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            No fue posible cargar el detalle de la reserva solicitada.
          </p>
          <div className="flex gap-4">
            <Button type="button" variant="secondary" onClick={() => reservaQuery.refetch()}>
              {t.reintentar}
            </Button>
            <Link
              to={RESTAURANTE_ROUTES.ADMIN_RESERVAS}
              className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors"
            >
              <span>{t.volverAlListado}</span>
            </Link>
          </div>
        </Card>
      )}

      {/* Detalle Administrativo */}
      {!reservaQuery.isLoading && reserva && (
        <Card className="p-8 space-y-8 border-neutro-200 shadow-sm">
          {/* Cabecera */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutro-200">
            <div>
              <p className="eyebrow">{t.detalleSubtitulo}</p>
              <h1 className="text-2xl font-bold text-neutro-900 font-serif">
                {t.detalleTitulo} #{reserva.id}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${
                  reserva.estado === "cancelada"
                    ? "bg-error-50 text-error-700 border-error-600/20"
                    : "bg-exito-50 text-exito-700 border-exito-600/20"
                }`}
              >
                {reserva.estado === "cancelada" ? "Cancelada" : "Confirmada"}
              </span>

              {reserva.estado === "confirmada" ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-error-600 hover:text-error-700 border-error-200"
                  onClick={() => handleOpenAction("cancelada")}
                >
                  <XCircle className="size-4 mr-1.5" aria-hidden="true" />
                  <span>{t.cancelarReserva}</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleOpenAction("confirmada")}
                >
                  <CheckCircle2 className="size-4 mr-1.5" aria-hidden="true" />
                  <span>{t.reactivarReserva}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Bloques de Datos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-lg bg-neutro-50 p-4 border border-neutro-200 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutro-500">
                {t.colCliente}
              </span>
              <p className="text-base font-bold text-neutro-900 flex items-center gap-1.5">
                <User className="size-4 text-bronce-600 shrink-0" aria-hidden="true" />
                <span>{reserva.Usuario?.nombre || "Cliente"}</span>
              </p>
              <p className="text-xs text-neutro-600 flex items-center gap-1.5 pl-5">
                <Mail className="size-3.5 text-neutro-400 shrink-0" aria-hidden="true" />
                <span>{reserva.Usuario?.email || `ID Usuario: ${reserva.usuario_id}`}</span>
              </p>
            </div>

            <div className="rounded-lg bg-neutro-50 p-4 border border-neutro-200 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutro-500">
                {t.colSede} y {t.colMesa}
              </span>
              <p className="text-base font-bold text-neutro-900 flex items-center gap-1.5">
                <MapPin className="size-4 text-bronce-600 shrink-0" aria-hidden="true" />
                <span>
                  {reserva.Mesa?.Sucursal?.nombre || `Sede #${reserva.Mesa?.sucursal_id ?? ""}`}
                </span>
              </p>
              <p className="text-xs text-neutro-600 flex items-center gap-1.5 pl-5">
                <UtensilsCrossed className="size-3.5 text-neutro-400 shrink-0" aria-hidden="true" />
                <span>
                  Mesa #{reserva.mesa_id} — {reserva.Mesa?.zona || "Salón"} (Aforo:{" "}
                  {reserva.Mesa?.capacidad || 4} comensales)
                </span>
              </p>
            </div>

            <div className="rounded-lg bg-neutro-50 p-4 border border-neutro-200 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutro-500">
                {t.colFecha} y {t.colHorario}
              </span>
              <p className="text-base font-bold text-neutro-900 flex items-center gap-1.5">
                <Calendar className="size-4 text-bronce-600 shrink-0" aria-hidden="true" />
                <span>{reserva.fecha}</span>
              </p>
              <p className="text-xs text-neutro-600 flex items-center gap-1.5 pl-5">
                <Clock className="size-3.5 text-neutro-400 shrink-0" aria-hidden="true" />
                <span>{reserva.hora} hrs</span>
              </p>
            </div>

            <div className="rounded-lg bg-neutro-50 p-4 border border-neutro-200 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutro-500">
                {t.colComensales}
              </span>
              <p className="text-base font-bold text-neutro-900 flex items-center gap-1.5">
                <Users className="size-4 text-bronce-600 shrink-0" aria-hidden="true" />
                <span>
                  {textosRestaurante.capacidadPersonas(reserva.numero_comensales)}
                </span>
              </p>
              {reserva.createdAt && (
                <p className="text-xs text-neutro-500 pl-5">
                  Registrada el {new Date(reserva.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Enlace de regreso */}
          <div className="pt-4 border-t border-neutro-200 flex justify-end">
            <Link
              to={RESTAURANTE_ROUTES.ADMIN_RESERVAS}
              className="inline-flex items-center gap-2 rounded-md border border-neutro-300 bg-white px-4 py-2 text-sm font-medium text-neutro-700 shadow-sm hover:bg-neutro-50 transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>{t.volverAlListado}</span>
            </Link>
          </div>
        </Card>
      )}

      {/* Modal de Confirmación */}
      <Modal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={
          nuevoEstadoObjetivo === "cancelada"
            ? t.confirmarCancelarTitulo
            : t.confirmarReactivarTitulo
        }
        description={
          nuevoEstadoObjetivo === "cancelada"
            ? t.confirmarCancelarDesc
            : t.confirmarReactivarDesc
        }
      >
        <div className="space-y-4 pt-2">
          {reserva && (
            <div className="rounded-md bg-neutro-50 p-4 border border-neutro-200 text-sm space-y-1">
              <p>
                <span className="font-semibold">{t.colId}:</span> #{reserva.id}
              </p>
              <p>
                <span className="font-semibold">{t.colCliente}:</span>{" "}
                {reserva.Usuario?.nombre}
              </p>
              <p>
                <span className="font-semibold">{t.colMesa}:</span> Mesa #{reserva.mesa_id}
              </p>
              <p>
                <span className="font-semibold">{t.colFecha} y {t.colHorario}:</span>{" "}
                {reserva.fecha} a las {reserva.hora} hrs
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-neutro-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={updateMutation.isPending}
            >
              {t.cerrarBoton}
            </Button>
            <Button
              type="button"
              variant={nuevoEstadoObjetivo === "cancelada" ? "danger" : "primary"}
              onClick={handleConfirmChange}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? t.procesando : t.confirmarBoton}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
