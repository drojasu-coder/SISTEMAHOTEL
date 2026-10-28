import { useLocale } from "@/i18n/LocaleContext";
import { textosRestaurante } from "./textos";

/** Textos de las pantallas administrativas de reservas de restaurante (ES/EN). */
const esAdmin = {
  ...textosRestaurante.adminReservas,
  estados: { confirmada: "Confirmada", cancelada: "Cancelada", desconocido: "Desconocido" },
  estadoRegistrado: (valor: string) => `Estado registrado: ${valor || "sin valor"}`,
  totalRegistros: (total: number) => `(Total: ${total})`,
  clienteSinNombre: "Cliente sin nombre",
  usuarioId: (id: number | string) => `Usuario #${id}`,
  sedeId: (id: number | string) => `Sede #${id}`,
  mesa: (id: number | string) => `Mesa #${id}`,
  zonaNoRegistrada: "Zona no registrada",
  aforo: (capacidad: number | null | undefined) =>
    capacidad ? `Aforo: ${capacidad} ${capacidad === 1 ? "comensal" : "comensales"}` : "Aforo no disponible",
  personas: (n: number) => `${n} ${n === 1 ? "persona" : "personas"}`,
  fechaHora: (fecha: string, hora: string) => `${fecha} a las ${hora}`,
  registradaEl: (fecha: string) => `Registrada el ${fecha}`,
  sedeYMesa: "Sede y mesa",
  fechaYHorario: "Fecha y horario",
  cancelarAria: (id: number) => `Cancelar reserva #${id}`,
  reactivarAria: (id: number) => `Reactivar reserva #${id}`,
  idInvalidoTitulo: "Identificador inválido",
  idInvalidoDesc: "El identificador proporcionado para la reserva administrativa no es válido.",
  errorCargarDetalle: "No fue posible cargar el detalle de la reserva solicitada.",
};

type TextosAdminRestaurante = typeof esAdmin;

const enAdmin: TextosAdminRestaurante = {
  titulo: "Restaurant reservations",
  subtitulo: "Dining management",
  descripcion: "Review and manage restaurant table reservations across all sites.",
  volverAlPanel: "Back to dashboard",
  irGestionMesas: "Table catalog",
  buscarPlaceholder: "Search by ID, guest or email...",
  todasLasSedes: "All sites",
  todosLosEstados: "All statuses",
  filtrarPorFecha: "Filter by date",
  todasLasFechas: "Any date",
  cargando: "Loading restaurant reservations...",
  errorCargar: "Restaurant reservations could not be loaded",
  reintentar: "Try again",
  sinReservasTitulo: "No restaurant reservations registered",
  sinReservasDesc: "No restaurant reservations have been received yet.",
  sinResultados: "No reservations match the selected criteria.",
  reservasMostradas: (count: number) => (count === 1 ? "1 reservation shown" : `${count} reservations shown`),
  colId: "ID",
  colCliente: "Guest",
  colSede: "Site",
  colMesa: "Table",
  colZona: "Area",
  colFecha: "Date",
  colHorario: "Time",
  colComensales: "Guests",
  colEstado: "Status",
  colAcciones: "Actions",
  verDetalle: "View details",
  cancelarReserva: "Cancel reservation",
  reactivarReserva: "Reactivate reservation",
  confirmarCancelarTitulo: "Cancel table reservation?",
  confirmarCancelarDesc:
    "Are you sure you want to cancel this restaurant reservation? The table will be released for the stated date and time.",
  confirmarReactivarTitulo: "Reactivate table reservation?",
  confirmarReactivarDesc:
    "Are you sure you want to reactivate this reservation? The system will check that the table is still available and meets the capacity and maintenance rules.",
  confirmarBoton: "Confirm",
  cerrarBoton: "Close",
  procesando: "Updating status...",
  estadoActualizadoExito: "The reservation status has been updated.",
  errorActualizarEstado: "The reservation status could not be updated.",
  errorConflictoReactivacion:
    "The reservation cannot be reactivated: the table is already booked for that date and time, or it is under maintenance.",
  detalleTitulo: "Restaurant reservation details",
  detalleSubtitulo: "Administrative review",
  volverAlListado: "Back to reservation list",
  clienteRegistrado: "Registered guest",
  emailCliente: "Email",
  estados: { confirmada: "Confirmed", cancelada: "Cancelled", desconocido: "Unknown" },
  estadoRegistrado: (valor: string) => `Recorded status: ${valor || "no value"}`,
  totalRegistros: (total: number) => `(Total: ${total})`,
  clienteSinNombre: "Unnamed guest",
  usuarioId: (id: number | string) => `User #${id}`,
  sedeId: (id: number | string) => `Site #${id}`,
  mesa: (id: number | string) => `Table #${id}`,
  zonaNoRegistrada: "Area not recorded",
  aforo: (capacidad: number | null | undefined) =>
    capacidad ? `Capacity: ${capacidad} ${capacidad === 1 ? "guest" : "guests"}` : "Capacity not available",
  personas: (n: number) => `${n} ${n === 1 ? "guest" : "guests"}`,
  fechaHora: (fecha: string, hora: string) => `${fecha} at ${hora}`,
  registradaEl: (fecha: string) => `Registered on ${fecha}`,
  sedeYMesa: "Site and table",
  fechaYHorario: "Date and time",
  cancelarAria: (id: number) => `Cancel reservation #${id}`,
  reactivarAria: (id: number) => `Reactivate reservation #${id}`,
  idInvalidoTitulo: "Invalid identifier",
  idInvalidoDesc: "The identifier provided for this administrative reservation is not valid.",
  errorCargarDetalle: "The requested reservation details could not be loaded.",
};

export function useTextosAdminRestaurante(): TextosAdminRestaurante {
  const { locale } = useLocale();
  return locale === "en" ? enAdmin : esAdmin;
}
