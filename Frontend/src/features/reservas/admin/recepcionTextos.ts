import { useLocale } from '@/i18n/LocaleContext';

/** Textos de la vista de recepción de reservas de habitación (ES/EN). */
const es = {
  titulo: 'Reservas de habitación',
  resumen: (n: number) => `${n} ${n === 1 ? 'reserva' : 'reservas'} en las sedes seleccionadas`,
  vistas: { llegadas: 'Llegan hoy', salidas: 'Salen hoy', pendientes: 'Pendientes', proximas: 'Próximas', todas: 'Todas' },
  vistasLabel: 'Vista de reservas',
  buscar: 'Buscar por número, huésped, correo o habitación',
  estado: 'Estado', todosEstados: 'Todos los estados',
  llegadaDesde: 'Llegada desde', llegadaHasta: 'Llegada hasta',
  limpiar: 'Limpiar filtros',
  col: { reserva: 'Reserva', huesped: 'Huésped', habitacion: 'Habitación', sede: 'Sede', estancia: 'Estancia', huespedes: 'Huéspedes', importe: 'Importe', estado: 'Estado', accion: 'Acción' },
  ver: 'Ver detalle', verReserva: (id: number) => `Ver detalle de la reserva #${id}`,
  hab: (n: string) => `Hab. ${n}`, noches: (n: number) => `${n} ${n === 1 ? 'noche' : 'noches'}`,
  sinHuesped: 'Huésped no registrado', sinHabitacion: 'Sin habitación',
  vacio: {
    llegadas: 'No hay llegadas confirmadas para hoy.', salidas: 'No hay salidas confirmadas para hoy.',
    pendientes: 'No hay reservas pendientes de confirmación.', proximas: 'No hay reservas próximas.',
    todas: 'No hay reservas registradas en las sedes seleccionadas.', filtros: 'Ninguna reserva coincide con los filtros.',
  },
  pagina: (desde: number, hasta: number, total: number) => `${desde}–${hasta} de ${total}`,
  anterior: 'Página anterior', siguiente: 'Página siguiente', hoy: 'Hoy',
};

const en: typeof es = {
  titulo: 'Room reservations',
  resumen: (n: number) => `${n} ${n === 1 ? 'reservation' : 'reservations'} in the selected sites`,
  vistas: { llegadas: 'Arriving today', salidas: 'Departing today', pendientes: 'Pending', proximas: 'Upcoming', todas: 'All' },
  vistasLabel: 'Reservation view',
  buscar: 'Search by number, guest, email or room',
  estado: 'Status', todosEstados: 'All statuses',
  llegadaDesde: 'Arrival from', llegadaHasta: 'Arrival to',
  limpiar: 'Clear filters',
  col: { reserva: 'Reservation', huesped: 'Guest', habitacion: 'Room', sede: 'Site', estancia: 'Stay', huespedes: 'Guests', importe: 'Amount', estado: 'Status', accion: 'Action' },
  ver: 'View details', verReserva: (id: number) => `View details of reservation #${id}`,
  hab: (n: string) => `Room ${n}`, noches: (n: number) => `${n} ${n === 1 ? 'night' : 'nights'}`,
  sinHuesped: 'Guest not recorded', sinHabitacion: 'No room',
  vacio: {
    llegadas: 'No confirmed arrivals today.', salidas: 'No confirmed departures today.',
    pendientes: 'No reservations awaiting confirmation.', proximas: 'No upcoming reservations.',
    todas: 'No reservations recorded in the selected sites.', filtros: 'No reservations match the filters.',
  },
  pagina: (from: number, to: number, total: number) => `${from}–${to} of ${total}`,
  anterior: 'Previous page', siguiente: 'Next page', hoy: 'Today',
};

export type TextosRecepcion = typeof es;
export function useTextosRecepcion(): TextosRecepcion {
  const { locale } = useLocale();
  return locale === 'en' ? en : es;
}
