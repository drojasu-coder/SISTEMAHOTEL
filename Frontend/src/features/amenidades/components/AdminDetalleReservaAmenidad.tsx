import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Armchair,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Alert, LoadingNotice } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/AuthContext";
import {
  useAdminReservaAmenidadDetalleQuery,
  useUpdateEstadoReservaAmenidadMutation,
} from "../hooks/useReservasAmenidad";
import { AMENIDADES_ROUTES } from "../constants/routes";
import { textosAmenidades } from "../textos";
import type { ReservaAmenidadEstado } from "../types";

export const AdminDetalleReservaAmenidad: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const reservaId = Number(id);
  const isValidId = Number.isInteger(reservaId) && reservaId > 0;

  const { user } = useAuth();
  const t = textosAmenidades.adminReservas;

  const detalleQuery = useAdminReservaAmenidadDetalleQuery(
    reservaId,
    user?.id,
    isValidId
  );
  const updateMutation = useUpdateEstadoReservaAmenidadMutation();

  const [modalAction, setModalAction] = useState<"cancelada" | "usada" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const reserva = detalleQuery.data;

  const estadoBadgeClass = (estado: ReservaAmenidadEstado) => {
    switch (estado) {
      case "confirmada":
        return "border-verde-200 bg-verde-50 text-verde-800";
      case "usada":
        return "border-azul-200 bg-azul-50 text-azul-800";
      case "cancelada":
        return "border-neutro-300 bg-neutro-100 text-neutro-600";
      default:
        return "border-neutro-200 bg-neutro-50 text-neutro-700";
    }
  };

  const estadoTexto = (estado: ReservaAmenidadEstado) => {
    switch (estado) {
      case "confirmada":
        return "Confirmada";
      case "usada":
        return "Completada / Usada";
      case "cancelada":
        return "Cancelada";
      default:
        return estado;
    }
  };

  const handleConfirmAction = async () => {
    if (!modalAction || !reserva) return;
    setActionError(null);
    setSuccessNotice(null);

    try {
      await updateMutation.mutateAsync({
        id: reserva.id,
        estado: modalAction,
      });
      setSuccessNotice(t.estadoActualizadoExito);
      setModalAction(null);
    } catch (err: any) {
      const code = err?.code || err?.response?.data?.code;
      const msg = err?.message || err?.response?.data?.message;

      if (code === "AMENITY_RESERVATION_STATUS_FINAL") {
        setActionError(t.estadoFinalNoModificable);
      } else {
        setActionError(msg || t.errorActualizarEstado);
      }
    }
  };

  if (!isValidId) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 py-8">
        <Alert tone="error" title="Identificador inválido">
          <p>El identificador de reserva especificado no es válido.</p>
        </Alert>
        <Link
          to={AMENIDADES_ROUTES.ADMIN_RESERVAS}
          className={buttonStyles({ variant: "ghost" })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t.volverAlListado}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-12">
      {/* Retorno */}
      <div>
        <Link
          to={AMENIDADES_ROUTES.ADMIN_RESERVAS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutro-600 hover:text-neutro-900 transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t.volverAlListado}</span>
        </Link>
      </div>

      {/* Estados de carga / error */}
      {detalleQuery.isPending && (
        <div className="flex justify-center py-16">
          <LoadingNotice label={t.cargando} />
        </div>
      )}

      {detalleQuery.isError && (
        <Card className="flex flex-col items-start gap-4 p-6 border border-neutro-200">
          <Alert tone="error" title={t.reservaNoEncontrada}>
            <p>
              No fue posible recuperar la información de la reserva #{reservaId}.
              Verifique que el identificador sea correcto.
            </p>
          </Alert>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => detalleQuery.refetch()}
              className="gap-2"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              <span>{t.reintentar}</span>
            </Button>
            <Link
              to={AMENIDADES_ROUTES.ADMIN_RESERVAS}
              className={buttonStyles({ variant: "ghost" })}
            >
              <span>{t.volverAlListado}</span>
            </Link>
          </div>
        </Card>
      )}

      {/* Notificación de éxito */}
      {successNotice && (
        <Alert tone="success" title="Operación completada">
          <p>{successNotice}</p>
        </Alert>
      )}

      {/* Detalle de la reserva */}
      {!detalleQuery.isPending && !detalleQuery.isError && reserva && (
        <div className="flex flex-col gap-6">
          {/* Encabezado y Acciones */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutro-200 pb-4">
            <div>
              <p className="eyebrow">{t.detalleSubtitulo}</p>
              <h1 className="text-2xl font-serif font-bold text-neutro-900 sm:text-3xl">
                Reserva #{reserva.id}
              </h1>
              <p className="text-xs text-neutro-500 mt-1">
                Registrada el{" "}
                {new Date(reserva.createdAt).toLocaleDateString("es-GT", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${estadoBadgeClass(
                  reserva.estado
                )}`}
              >
                {estadoTexto(reserva.estado)}
              </span>

              {reserva.estado === "confirmada" ? (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setModalAction("usada")}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    <span>{t.marcarUsada}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setModalAction("cancelada")}
                    className="gap-1.5"
                  >
                    <XCircle className="size-4" aria-hidden="true" />
                    <span>{t.cancelarReserva}</span>
                  </Button>
                </>
              ) : (
                <span className="text-xs text-neutro-500 italic">
                  {t.estadoFinalNoModificable}
                </span>
              )}
            </div>
          </div>

          {/* Grid de contenido */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Columna Izquierda: Datos del cliente, amenidad y reserva */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              {/* Información del Cliente */}
              <Card className="flex flex-col gap-3 p-5 border border-neutro-200">
                <div className="flex items-center gap-2 border-b border-neutro-100 pb-2 text-sm font-semibold text-neutro-900">
                  <User className="size-4 text-bronce-600" aria-hidden="true" />
                  <span>{t.clienteInfo}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <span className="text-neutro-500 block">Nombre:</span>
                    <span className="font-semibold text-neutro-900 text-sm">
                      {reserva.Usuario?.nombre || t.noEspecificado}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutro-500 block">Identificador de usuario:</span>
                    <span className="font-mono text-neutro-800">
                      #{reserva.usuario_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3.5 text-neutro-400 shrink-0" aria-hidden="true" />
                    <span className="text-neutro-700">
                      {reserva.Usuario?.email || t.noEspecificado}
                    </span>
                  </div>
                  {reserva.Usuario?.telefono && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-neutro-400 shrink-0" aria-hidden="true" />
                      <span className="text-neutro-700">{reserva.Usuario.telefono}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Información de la Amenidad y Sede */}
              <Card className="flex flex-col gap-3 p-5 border border-neutro-200">
                <div className="flex items-center gap-2 border-b border-neutro-100 pb-2 text-sm font-semibold text-neutro-900">
                  <ShieldCheck className="size-4 text-selva-700" aria-hidden="true" />
                  <span>{t.amenidadInfo}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <span className="text-neutro-500 block">Amenidad:</span>
                    <span className="font-serif font-bold text-neutro-900 text-base">
                      {reserva.Amenidad?.nombre || "Amenidad"}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutro-500 block">Sede asignada:</span>
                    <span className="font-medium text-neutro-800 flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3.5 text-bronce-600 shrink-0" aria-hidden="true" />
                      {reserva.Amenidad?.Sucursal?.nombre || "Hotel Hunapú"}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutro-500 block">Aforo máximo de la amenidad:</span>
                    <span className="font-medium text-neutro-800 flex items-center gap-1 mt-0.5">
                      <Users className="size-3.5 text-neutro-400 shrink-0" aria-hidden="true" />
                      {reserva.Amenidad?.aforo_maximo} personas
                    </span>
                  </div>
                </div>
              </Card>

              {/* Detalles del Acceso */}
              <Card className="flex flex-col gap-3 p-5 border border-neutro-200">
                <div className="flex items-center gap-2 border-b border-neutro-100 pb-2 text-sm font-semibold text-neutro-900">
                  <Clock className="size-4 text-azul-700" aria-hidden="true" />
                  <span>{t.reservaInfo}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                  <div className="flex items-center gap-2 rounded-md bg-neutro-50 p-3">
                    <Calendar className="size-4 text-neutro-500" aria-hidden="true" />
                    <div>
                      <span className="text-neutro-500 text-[11px] block">Fecha reservada:</span>
                      <strong className="text-neutro-900 text-sm">{reserva.fecha}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-neutro-50 p-3">
                    <Clock className="size-4 text-neutro-500" aria-hidden="true" />
                    <div>
                      <span className="text-neutro-500 text-[11px] block">Franja horaria:</span>
                      <strong className="text-neutro-900 text-sm">{reserva.franja_horaria}</strong>
                    </div>
                  </div>
                </div>
                <div className="mt-1 text-xs">
                  <span className="text-neutro-500 flex items-center gap-1">
                    <Armchair className="size-3.5 text-neutro-400" aria-hidden="true" />
                    Mobiliario / requerimiento adicional:
                  </span>
                  <span className="font-medium text-neutro-800 mt-0.5 block pl-5">
                    {reserva.mobiliario || "Ninguno"}
                  </span>
                </div>
              </Card>
            </div>

            {/* Columna Derecha: Pase de Entrada con QR y Código Textual */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              <Card className="flex flex-col items-center justify-center p-6 text-center border border-neutro-200 bg-white">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutro-900 mb-4">
                  <QrCode className="size-4 text-bronce-600" aria-hidden="true" />
                  <span>{t.codigoQrTitulo}</span>
                </div>

                {reserva.codigo_qr ? (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="rounded-xl border border-neutro-200 bg-white p-3 shadow-xs">
                      <QRCodeSVG
                        value={reserva.codigo_qr}
                        size={180}
                        level="M"
                        includeMargin
                        aria-label={`Código QR para reserva ${reserva.id}`}
                      />
                    </div>

                    <div className="flex flex-col gap-1 w-full max-w-xs">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutro-500">
                        {t.codigoAcceso}
                      </span>
                      <code className="rounded bg-neutro-100 px-2 py-1 font-mono text-xs font-bold text-neutro-800 break-all select-all">
                        {reserva.codigo_qr}
                      </code>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutro-500 italic py-6">
                    Código de acceso no disponible
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para cambio de estado */}
      <Modal
        open={Boolean(modalAction)}
        onClose={() => {
          if (!updateMutation.isPending) {
            setModalAction(null);
            setActionError(null);
          }
        }}
        title={t.confirmarAccionTitulo}
        description={`Reserva #${reserva?.id} — ${reserva?.Amenidad?.nombre || "Amenidad"}`}
      >
        <div className="flex flex-col gap-4 py-2">
          {actionError && (
            <Alert tone="error" title={t.errorActualizarEstado}>
              <p>{actionError}</p>
            </Alert>
          )}

          <p className="text-sm text-neutro-700 leading-relaxed">
            {modalAction === "usada"
              ? t.confirmarMarcarUsada
              : t.confirmarCancelar}
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutro-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setModalAction(null);
                setActionError(null);
              }}
              disabled={updateMutation.isPending}
            >
              {t.cerrarBoton}
            </Button>
            <Button
              type="button"
              variant={modalAction === "cancelada" ? "danger" : "primary"}
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
