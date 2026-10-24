import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  MapPin,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Alert, LoadingNotice } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { AMENIDADES_ROUTES } from "../constants/routes";
import { textosAmenidades } from "../textos";
import { useUpdateEstadoReservaAmenidadMutation } from "../hooks/useReservasAmenidad";
import type { ReservaAmenidad, ReservaAmenidadEstado } from "../types";

interface AdminReservasAmenidadesListProps {
  reservas: ReservaAmenidad[];
  isLoading: boolean;
  isError: boolean;
  onRefetch: () => void;
  totalSinFiltrar: number;
}

export const AdminReservasAmenidadesList: React.FC<AdminReservasAmenidadesListProps> = ({
  reservas,
  isLoading,
  isError,
  onRefetch,
  totalSinFiltrar,
}) => {
  const t = textosAmenidades.adminReservas;
  const updateMutation = useUpdateEstadoReservaAmenidadMutation();

  // Modal de confirmación para cambio de estado
  const [modalAction, setModalAction] = useState<{
    reserva: ReservaAmenidad;
    nuevoEstado: "cancelada" | "usada";
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
    if (!modalAction) return;
    setActionError(null);

    try {
      await updateMutation.mutateAsync({
        id: modalAction.reserva.id,
        estado: modalAction.nuevoEstado,
      });
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingNotice label={t.cargando} />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="flex flex-col items-start gap-4 p-6 border border-neutro-200">
        <Alert tone="error" title={t.errorCargar}>
          <p>Ocurrió un problema al obtener las reservas de amenidades.</p>
        </Alert>
        <Button type="button" variant="ghost" onClick={onRefetch} className="gap-2">
          <RefreshCw className="size-4" aria-hidden="true" />
          <span>{t.reintentar}</span>
        </Button>
      </Card>
    );
  }

  if (totalSinFiltrar === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center border border-neutro-200">
        <Sparkles className="size-12 text-neutro-400" aria-hidden="true" />
        <div className="flex max-w-md flex-col gap-1">
          <h2 className="text-lg font-serif font-semibold text-neutro-800">
            {t.sinReservasTitulo}
          </h2>
          <p className="text-xs text-neutro-600">{t.sinReservasDesc}</p>
        </div>
      </Card>
    );
  }

  if (reservas.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center border border-neutro-200">
        <p className="text-sm text-neutro-600">{t.sinResultados}</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-neutro-500">
        {t.reservasMostradas(reservas.length)}
      </p>

      {/* Tabla para pantallas medianas y grandes */}
      <div className="hidden overflow-x-auto rounded-lg border border-neutro-200 bg-white shadow-xs md:block">
        <table className="w-full text-left text-xs text-neutro-700">
          <thead className="bg-neutro-50 border-b border-neutro-200 font-semibold text-neutro-600 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3">{t.colId}</th>
              <th className="px-4 py-3">{t.colCliente}</th>
              <th className="px-4 py-3">{t.colAmenidad}</th>
              <th className="px-4 py-3">{t.colFecha}</th>
              <th className="px-4 py-3">{t.colHorario}</th>
              <th className="px-4 py-3">{t.colMobiliario}</th>
              <th className="px-4 py-3">{t.colEstado}</th>
              <th className="px-4 py-3 text-right">{t.colAcciones}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutro-100">
            {reservas.map((reserva) => {
              const clienteNombre = reserva.Usuario?.nombre || "Cliente";
              const clienteEmail = reserva.Usuario?.email || "";
              const amenidadNombre = reserva.Amenidad?.nombre || "Amenidad";
              const sedeNombre = reserva.Amenidad?.Sucursal?.nombre || "Sede";

              const puedeModificar = reserva.estado === "confirmada";

              return (
                <tr key={reserva.id} className="hover:bg-neutro-50/60 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-neutro-900">
                    #{reserva.id}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-neutro-900">{clienteNombre}</span>
                      <span className="text-[11px] text-neutro-500">{clienteEmail}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-neutro-900">{amenidadNombre}</span>
                      <span className="text-[11px] text-neutro-500 flex items-center gap-1">
                        <MapPin className="size-3 text-bronce-600 shrink-0" aria-hidden="true" />
                        {sedeNombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-neutro-800 font-medium whitespace-nowrap">
                    {reserva.fecha}
                  </td>
                  <td className="px-4 py-3.5 text-neutro-800 font-medium whitespace-nowrap">
                    {reserva.franja_horaria}
                  </td>
                  <td className="px-4 py-3.5 text-neutro-600">
                    {reserva.mobiliario || "ninguno"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoBadgeClass(
                        reserva.estado
                      )}`}
                    >
                      {estadoTexto(reserva.estado)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {puedeModificar && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setModalAction({
                                reserva,
                                nuevoEstado: "usada",
                              })
                            }
                            title={t.marcarUsada}
                            className="text-azul-700 hover:bg-azul-50 hover:text-azul-900 p-1.5 h-auto"
                          >
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            <span className="sr-only">{t.marcarUsada}</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setModalAction({
                                reserva,
                                nuevoEstado: "cancelada",
                              })
                            }
                            title={t.cancelarReserva}
                            className="text-error-600 hover:bg-error-50 hover:text-error-800 p-1.5 h-auto"
                          >
                            <XCircle className="size-4" aria-hidden="true" />
                            <span className="sr-only">{t.cancelarReserva}</span>
                          </Button>
                        </>
                      )}
                      <Link
                        to={AMENIDADES_ROUTES.ADMIN_DETALLE_RESERVA(reserva.id)}
                        className={buttonStyles({
                          variant: "secondary",
                          size: "sm",
                          className: "gap-1 text-xs py-1",
                        })}
                      >
                        <Eye className="size-3.5" aria-hidden="true" />
                        <span>{t.verDetalle}</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tarjetas para pantallas móviles */}
      <div className="flex flex-col gap-4 md:hidden">
        {reservas.map((reserva) => {
          const clienteNombre = reserva.Usuario?.nombre || "Cliente";
          const clienteEmail = reserva.Usuario?.email || "";
          const amenidadNombre = reserva.Amenidad?.nombre || "Amenidad";
          const sedeNombre = reserva.Amenidad?.Sucursal?.nombre || "Sede";
          const puedeModificar = reserva.estado === "confirmada";

          return (
            <Card
              key={reserva.id}
              className="flex flex-col gap-3 p-4 border border-neutro-200"
            >
              <div className="flex items-center justify-between border-b border-neutro-100 pb-2">
                <span className="font-mono font-bold text-neutro-900 text-sm">
                  #{reserva.id}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoBadgeClass(
                    reserva.estado
                  )}`}
                >
                  {estadoTexto(reserva.estado)}
                </span>
              </div>

              <div>
                <h3 className="font-serif font-bold text-neutro-900 text-base">
                  {amenidadNombre}
                </h3>
                <p className="text-xs text-neutro-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3 text-bronce-600 shrink-0" aria-hidden="true" />
                  {sedeNombre}
                </p>
              </div>

              <div className="rounded-md bg-neutro-50 p-2.5 text-xs text-neutro-700 flex flex-col gap-1">
                <span className="font-semibold flex items-center gap-1">
                  <User className="size-3 text-neutro-500" aria-hidden="true" />
                  {clienteNombre}
                </span>
                <span className="text-neutro-500 text-[11px]">{clienteEmail}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-neutro-600">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-neutro-400" aria-hidden="true" />
                  {reserva.fecha}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5 text-neutro-400" aria-hidden="true" />
                  {reserva.franja_horaria}
                </span>
              </div>

              {reserva.mobiliario && reserva.mobiliario !== "ninguno" && (
                <p className="text-xs text-neutro-500">
                  Mobiliario: <strong className="text-neutro-700">{reserva.mobiliario}</strong>
                </p>
              )}

              <div className="flex items-center gap-2 border-t border-neutro-100 pt-3">
                <Link
                  to={AMENIDADES_ROUTES.ADMIN_DETALLE_RESERVA(reserva.id)}
                  className={buttonStyles({
                    variant: "secondary",
                    size: "sm",
                    className: "flex-1 justify-center gap-1",
                  })}
                >
                  <Eye className="size-3.5" aria-hidden="true" />
                  <span>{t.verDetalle}</span>
                </Link>

                {puedeModificar && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setModalAction({
                          reserva,
                          nuevoEstado: "usada",
                        })
                      }
                      title={t.marcarUsada}
                      className="text-azul-700 hover:bg-azul-50"
                    >
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setModalAction({
                          reserva,
                          nuevoEstado: "cancelada",
                        })
                      }
                      title={t.cancelarReserva}
                      className="text-error-600 hover:bg-error-50"
                    >
                      <XCircle className="size-4" aria-hidden="true" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal accesible de confirmación de cambio de estado */}
      <Modal
        open={Boolean(modalAction)}
        onClose={() => {
          if (!updateMutation.isPending) {
            setModalAction(null);
            setActionError(null);
          }
        }}
        title={t.confirmarAccionTitulo}
        description={`Reserva #${modalAction?.reserva.id} — ${modalAction?.reserva.Amenidad?.nombre || "Amenidad"}`}
      >
        <div className="flex flex-col gap-4 py-2">
          {actionError && (
            <Alert tone="error" title={t.errorActualizarEstado}>
              <p>{actionError}</p>
            </Alert>
          )}

          <p className="text-sm text-neutro-700 leading-relaxed">
            {modalAction?.nuevoEstado === "usada"
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
